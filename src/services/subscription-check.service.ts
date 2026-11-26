import cron, { ScheduledTask } from 'node-cron';
import Organization from '../models/Organization';
import User from '../models/User';
import notificationService from './notification.service';
import { sendSubscriptionMilestoneEmail } from '../utils/email';
import { SubscriptionStatus } from '../types';
import logger from '../utils/logger';

/**
 * Subscription Check Service
 *
 * StoryBrand Framework Milestones:
 * - 5 days before expiry
 * - 1 day before expiry
 * - 0 days (day of expiry)
 * - 3 days after expiry
 * - 1 week after expiry (7 days)
 * - 2 weeks after expiry (14 days)
 * - 3 weeks after expiry (21 days)
 * - 1 month after expiry (30 days) -> Then it stops.
 *
 * Runs automatically as a cron job every night at midnight (00:00).
 */
export class SubscriptionCheckService {
    private static cronTask: ScheduledTask | null = null;

    /**
     * Check all active/trialing/expired organizations and trigger StoryBrand notifications
     */
    static async checkAllExpirations(): Promise<{
        checked: number;
        notified5Days: number;
        notified1Day: number;
        notifiedExpired: number;
        notified3DaysAfter: number;
        notified1WeekAfter: number;
        notified2WeeksAfter: number;
        notified3WeeksAfter: number;
        notified1MonthAfter: number;
        stopped: number;
    }> {
        logger.info('[SubscriptionCheck] Running midnight expiration checks...');
        const stats = {
            checked: 0,
            notified5Days: 0,
            notified1Day: 0,
            notifiedExpired: 0,
            notified3DaysAfter: 0,
            notified1WeekAfter: 0,
            notified2WeeksAfter: 0,
            notified3WeeksAfter: 0,
            notified1MonthAfter: 0,
            stopped: 0,
        };

        try {
            // Organizations on 'free' plan have subscriptionEndsAt = null and are ignored here
            const orgs = await Organization.find({
                subscriptionEndsAt: { $ne: null },
                subscriptionStatus: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED] }
            });

            stats.checked = orgs.length;
            const now = Date.now();

            for (const org of orgs) {
                if (!org.subscriptionEndsAt) continue;

                const endsAtTime = new Date(org.subscriptionEndsAt).getTime();
                const diffMs = endsAtTime - now;

                const reminders = (org as any).subscriptionRemindersSent || {};
                let updated = false;

                // Owner user to receive Push, In-App, and Email
                const owner = await User.findById(org.createdBy);
                if (!owner) continue;

                const formattedExpiryDate = new Date(org.subscriptionEndsAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                });

                // ==========================================
                // CASE A: BEFORE EXPIRY (endsAtTime > now)
                // ==========================================
                if (diffMs > 0) {
                    const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                    // 1. Milestone: 5 Days Before
                    if (daysUntilExpiry <= 5 && daysUntilExpiry > 1) {
                        const alreadySent5Days = reminders.fiveDays && (now - new Date(reminders.fiveDays).getTime()) < 30 * 24 * 60 * 60 * 1000;
                        if (!alreadySent5Days) {
                            logger.info(`[SubscriptionCheck] Sending 5-day StoryBrand notice for org ${org.name} (${org._id})`);

                            await notificationService.sendToUser(owner._id.toString(), {
                                title: 'Keep Your Shop Running Seamlessly',
                                message: `Your SewDigital access for ${org.name} expires in 5 days. Don't let paper chaos disrupt your orders—renew today to keep your atelier running without a hitch.`,
                                type: 'SUBSCRIPTION_EXPIRING_5_DAYS',
                                data: { daysLeft: 5, orgId: org._id.toString() }
                            });

                            if (owner.email) {
                                await sendSubscriptionMilestoneEmail({
                                    email: owner.email,
                                    name: owner.name,
                                    orgName: org.name,
                                    subject: 'Don’t let order chaos slow down your craft (5 days left)',
                                    headline: 'Keep your fashion studio organized and stress-free',
                                    leadParagraph: `You’ve poured your heart into building a fashion brand your clients trust. Every fitting, measurement, and timely delivery sets you apart as a true professional.`,
                                    alertBoxTitle: `Your SewDigital access expires in 5 days (${formattedExpiryDate})`,
                                    alertBoxMessage: `When a subscription lapses, client order tracking and team access pause—putting deadlines at risk. Avoid last-minute stress by renewing today.`,
                                    isDanger: false,
                                    ctaText: 'Renew Subscription Today',
                                });
                            }

                            if (!(org as any).subscriptionRemindersSent) (org as any).subscriptionRemindersSent = {};
                            (org as any).subscriptionRemindersSent.fiveDays = new Date();
                            updated = true;
                            stats.notified5Days++;
                        }
                    }

                    // 2. Milestone: 1 Day Before (Tomorrow)
                    else if (daysUntilExpiry <= 1 && daysUntilExpiry > 0) {
                        const alreadySent1Day = reminders.oneDay && (now - new Date(reminders.oneDay).getTime()) < 15 * 24 * 60 * 60 * 1000;
                        if (!alreadySent1Day) {
                            logger.info(`[SubscriptionCheck] Sending 1-day StoryBrand notice for org ${org.name} (${org._id})`);

                            await notificationService.sendToUser(owner._id.toString(), {
                                title: '⚠️ Tomorrow: Protect Your Client Orders',
                                message: `Your subscription for ${org.name} expires tomorrow! Take 30 seconds to renew today and ensure your team and orders stay uninterrupted.`,
                                type: 'SUBSCRIPTION_EXPIRING_1_DAY',
                                data: { daysLeft: 1, orgId: org._id.toString() }
                            });

                            if (owner.email) {
                                await sendSubscriptionMilestoneEmail({
                                    email: owner.email,
                                    name: owner.name,
                                    orgName: org.name,
                                    subject: '⚠️ Tomorrow: Protect your client orders and deadlines',
                                    headline: "Don't let tomorrow bring unexpected studio delays",
                                    leadParagraph: `Your clients rely on you to make them look exceptional for their biggest moments. You shouldn't have to stress over locked features or scrambling through paper notes when clients walk in.`,
                                    alertBoxTitle: 'Tomorrow is your final day of active access',
                                    alertBoxMessage: 'Starting tomorrow night, staff collaboration and measurement management will pause. Renew now so your shop workflow does not skip a single beat.',
                                    isDanger: true,
                                    ctaText: 'Protect My Shop Flow',
                                });
                            }

                            if (!(org as any).subscriptionRemindersSent) (org as any).subscriptionRemindersSent = {};
                            (org as any).subscriptionRemindersSent.oneDay = new Date();
                            updated = true;
                            stats.notified1Day++;
                        }
                    }
                }

                // ==========================================
                // CASE B: AFTER EXPIRY (endsAtTime <= now)
                // ==========================================
                else {
                    const daysSinceExpiry = Math.floor((now - endsAtTime) / (1000 * 60 * 60 * 24));

                    // If expired, ensure status is marked EXPIRED
                    if (org.subscriptionStatus !== SubscriptionStatus.EXPIRED) {
                        org.subscriptionStatus = SubscriptionStatus.EXPIRED;
                        updated = true;
                    }

                    // STOP CONDITION: If more than 35 days past expiry or oneMonthAfter already sent, stop completely
                    if (daysSinceExpiry > 35 || reminders.oneMonthAfter) {
                        stats.stopped++;
                        continue;
                    }

                    // 3. Milestone: Day of Expiry (0 days, up to 2 days)
                    if (daysSinceExpiry >= 0 && daysSinceExpiry < 3) {
                        const alreadySentExpired = reminders.expired && (now - new Date(reminders.expired).getTime()) < 15 * 24 * 60 * 60 * 1000;
                        if (!alreadySentExpired) {
                            logger.info(`[SubscriptionCheck] Sending Day 0 StoryBrand expired notice for org ${org.name} (${org._id})`);

                            await notificationService.sendToUser(owner._id.toString(), {
                                title: 'Your Shop Deserves Uninterrupted Success',
                                message: `Your premium access for ${org.name} expired today. All client data is 100% safe, but features are paused. Renew now to restore full access for you and your team.`,
                                type: 'SUBSCRIPTION_EXPIRED',
                                data: { daysLeft: 0, orgId: org._id.toString() }
                            });

                            if (owner.email) {
                                await sendSubscriptionMilestoneEmail({
                                    email: owner.email,
                                    name: owner.name,
                                    orgName: org.name,
                                    subject: 'Your client data is safe — let’s get your shop back on track',
                                    headline: 'Your craft is too valuable for admin headaches',
                                    leadParagraph: `You didn't start your fashion business to spend hours searching through paper notebooks or fielding panicked "is my outfit ready?" calls. You started it to create.`,
                                    alertBoxTitle: 'Your subscription expired today',
                                    alertBoxMessage: 'Good news: All your customer profiles, measurements, and order histories are safely stored in your vault. Premium tools and staff accounts are temporarily paused until you renew.',
                                    isDanger: true,
                                    ctaText: 'Restore Full Access Now',
                                });
                            }

                            if (!(org as any).subscriptionRemindersSent) (org as any).subscriptionRemindersSent = {};
                            (org as any).subscriptionRemindersSent.expired = new Date();
                            updated = true;
                            stats.notifiedExpired++;
                        }
                    }

                    // 4. Milestone: 3 Days After Expiry
                    else if (daysSinceExpiry >= 3 && daysSinceExpiry < 7) {
                        const alreadySent3Days = reminders.threeDaysAfter && (now - new Date(reminders.threeDaysAfter).getTime()) < 15 * 24 * 60 * 60 * 1000;
                        if (!alreadySent3Days) {
                            logger.info(`[SubscriptionCheck] Sending 3-days-after StoryBrand notice for org ${org.name} (${org._id})`);

                            await notificationService.sendToUser(owner._id.toString(), {
                                title: 'Tired of Paper Chaos Creeping In?',
                                message: `Running a fashion business is demanding enough without lost measurements. Reconnect SewDigital today and restore effortless order to ${org.name}.`,
                                type: 'SUBSCRIPTION_EXPIRED_3_DAYS',
                                data: { daysSinceExpiry, orgId: org._id.toString() }
                            });

                            if (owner.email) {
                                await sendSubscriptionMilestoneEmail({
                                    email: owner.email,
                                    name: owner.name,
                                    orgName: org.name,
                                    subject: 'Is paper chaos creeping back into your atelier?',
                                    headline: 'Bring calm and clarity back to your cutting table',
                                    leadParagraph: `When you're juggling fabric runs, client fittings, and workshop deadlines, paper notebooks and sticky notes quickly become a nightmare. One misplaced measurement can ruin an entire outfit.`,
                                    alertBoxTitle: "It's been 3 days since your plan paused",
                                    alertBoxMessage: 'SewDigital is ready to take the burden off your shoulders. Your measurements and orders are intact and ready to reopen immediately.',
                                    isDanger: false,
                                    ctaText: 'Reconnect My Workspace',
                                });
                            }

                            if (!(org as any).subscriptionRemindersSent) (org as any).subscriptionRemindersSent = {};
                            (org as any).subscriptionRemindersSent.threeDaysAfter = new Date();
                            updated = true;
                            stats.notified3DaysAfter++;
                        }
                    }

                    // 5. Milestone: 1 Week After Expiry (7 Days)
                    else if (daysSinceExpiry >= 7 && daysSinceExpiry < 14) {
                        const alreadySent1Week = reminders.oneWeekAfter && (now - new Date(reminders.oneWeekAfter).getTime()) < 15 * 24 * 60 * 60 * 1000;
                        if (!alreadySent1Week) {
                            logger.info(`[SubscriptionCheck] Sending 1-week-after StoryBrand notice for org ${org.name} (${org._id})`);

                            await notificationService.sendToUser(owner._id.toString(), {
                                title: 'More Time Designing, Less Time Chasing Orders',
                                message: `It's been 1 week since your subscription ended. Don't let manual tracking cost you client trust. Reactivate ${org.name} anytime.`,
                                type: 'SUBSCRIPTION_EXPIRED_1_WEEK',
                                data: { daysSinceExpiry, orgId: org._id.toString() }
                            });

                            if (owner.email) {
                                await sendSubscriptionMilestoneEmail({
                                    email: owner.email,
                                    name: owner.name,
                                    orgName: org.name,
                                    subject: 'Spend more time designing, less time managing chaos',
                                    headline: 'You deserve to be the creator, not the paper-pusher',
                                    leadParagraph: `World-class fashion designers don't build reputations on manual record-keeping. They build them on precision fits, flawless finishes, and clients who rave to their friends.`,
                                    alertBoxTitle: '1 week since your subscription ended',
                                    alertBoxMessage: 'How much time did you spend this past week handwriting measurements, messaging clients, or looking for order notes? Let SewDigital do the heavy lifting for you.',
                                    isDanger: false,
                                    ctaText: 'Reactivate SewDigital Today',
                                });
                            }

                            if (!(org as any).subscriptionRemindersSent) (org as any).subscriptionRemindersSent = {};
                            (org as any).subscriptionRemindersSent.oneWeekAfter = new Date();
                            updated = true;
                            stats.notified1WeekAfter++;
                        }
                    }

                    // 6. Milestone: 2 Weeks After Expiry (14 Days)
                    else if (daysSinceExpiry >= 14 && daysSinceExpiry < 21) {
                        const alreadySent2Weeks = reminders.twoWeeksAfter && (now - new Date(reminders.twoWeeksAfter).getTime()) < 15 * 24 * 60 * 60 * 1000;
                        if (!alreadySent2Weeks) {
                            logger.info(`[SubscriptionCheck] Sending 2-weeks-after StoryBrand notice for org ${org.name} (${org._id})`);

                            await notificationService.sendToUser(owner._id.toString(), {
                                title: 'Your Clients Deserve Your Best Work',
                                message: `Miss having every measurement and order status at your fingertips? Your records for ${org.name} are waiting for you.`,
                                type: 'SUBSCRIPTION_EXPIRED_2_WEEKS',
                                data: { daysSinceExpiry, orgId: org._id.toString() }
                            });

                            if (owner.email) {
                                await sendSubscriptionMilestoneEmail({
                                    email: owner.email,
                                    name: owner.name,
                                    orgName: org.name,
                                    subject: 'How is your atelier running this week?',
                                    headline: "We're holding your studio's spot for you",
                                    leadParagraph: `Building a profitable fashion brand requires clarity and discipline. When your tools work for you, you can take on more high-paying clients without feeling overwhelmed.`,
                                    alertBoxTitle: '2 weeks since your plan expired',
                                    alertBoxMessage: 'Every customer measurement, past order detail, and gallery item you’ve ever entered is safely preserved. Nothing has been deleted.',
                                    isDanger: false,
                                    ctaText: 'Jump Back In',
                                });
                            }

                            if (!(org as any).subscriptionRemindersSent) (org as any).subscriptionRemindersSent = {};
                            (org as any).subscriptionRemindersSent.twoWeeksAfter = new Date();
                            updated = true;
                            stats.notified2WeeksAfter++;
                        }
                    }

                    // 7. Milestone: 3 Weeks After Expiry (21 Days)
                    else if (daysSinceExpiry >= 21 && daysSinceExpiry < 30) {
                        const alreadySent3Weeks = reminders.threeWeeksAfter && (now - new Date(reminders.threeWeeksAfter).getTime()) < 15 * 24 * 60 * 60 * 1000;
                        if (!alreadySent3Weeks) {
                            logger.info(`[SubscriptionCheck] Sending 3-weeks-after StoryBrand notice for org ${org.name} (${org._id})`);

                            await notificationService.sendToUser(owner._id.toString(), {
                                title: 'Ready to Reclaim Your Peace of Mind?',
                                message: `Eliminate missed delivery dates and miscommunication with clients. Your studio dashboard for ${org.name} is waiting for you.`,
                                type: 'SUBSCRIPTION_EXPIRED_3_WEEKS',
                                data: { daysSinceExpiry, orgId: org._id.toString() }
                            });

                            if (owner.email) {
                                await sendSubscriptionMilestoneEmail({
                                    email: owner.email,
                                    name: owner.name,
                                    orgName: org.name,
                                    subject: 'Ready to eliminate shop stress and late deliveries?',
                                    headline: 'Eliminate missed deadlines before they happen',
                                    leadParagraph: `Every delayed delivery or misunderstood measurement chips away at the client trust you spent years earning. You deserve a dedicated system that has your back on every order.`,
                                    alertBoxTitle: '3 weeks since your plan ended',
                                    alertBoxMessage: "If running your shop manually has been draining your energy, there's an easy way out. Your entire SewDigital setup is one click away from being fully restored.",
                                    isDanger: false,
                                    ctaText: 'Reclaim My Peace of Mind',
                                });
                            }

                            if (!(org as any).subscriptionRemindersSent) (org as any).subscriptionRemindersSent = {};
                            (org as any).subscriptionRemindersSent.threeWeeksAfter = new Date();
                            updated = true;
                            stats.notified3WeeksAfter++;
                        }
                    }

                    // 8. Milestone: 1 Month After Expiry (30 Days) - Final Notification
                    else if (daysSinceExpiry >= 30 && daysSinceExpiry <= 35) {
                        const alreadySent1Month = reminders.oneMonthAfter && (now - new Date(reminders.oneMonthAfter).getTime()) < 15 * 24 * 60 * 60 * 1000;
                        if (!alreadySent1Month) {
                            logger.info(`[SubscriptionCheck] Sending 1-month-after StoryBrand notice (FINAL) for org ${org.name} (${org._id})`);

                            await notificationService.sendToUser(owner._id.toString(), {
                                title: "Our Final Check-In: We're Rooting for You",
                                message: `This is our final reminder for ${org.name}. Your measurements and client records remain securely stored. We're here whenever you're ready to grow.`,
                                type: 'SUBSCRIPTION_EXPIRED_1_MONTH',
                                data: { daysSinceExpiry, orgId: org._id.toString() }
                            });

                            if (owner.email) {
                                await sendSubscriptionMilestoneEmail({
                                    email: owner.email,
                                    name: owner.name,
                                    orgName: org.name,
                                    subject: 'Final check-in: We’ll always keep your records safe',
                                    headline: 'Wishing you and your fashion business the very best',
                                    leadParagraph: `As fellow lovers of the craft, we respect your inbox. We promised not to clutter your email, so this is our final scheduled reminder.`,
                                    alertBoxTitle: 'Our last reminder: Your data is safe in our vault',
                                    alertBoxMessage: 'Whenever you decide to expand your team, take on more orders, or streamline your operations, SewDigital will be right here with all your measurements and records intact.',
                                    isDanger: false,
                                    ctaText: 'Reopen My Atelier When Ready',
                                });
                            }

                            if (!(org as any).subscriptionRemindersSent) (org as any).subscriptionRemindersSent = {};
                            (org as any).subscriptionRemindersSent.oneMonthAfter = new Date();
                            updated = true;
                            stats.notified1MonthAfter++;
                        }
                    }
                }

                if (updated) {
                    await org.save();
                }
            }

            logger.info('[SubscriptionCheck] Midnight expiration check completed', stats);
            return stats;
        } catch (error) {
            logger.error('[SubscriptionCheck] Error checking subscription expirations', { error });
            return stats;
        }
    }

    /**
     * Start the midnight cron schedule (00:00 every night)
     */
    static startScheduler(): ScheduledTask {
        if (SubscriptionCheckService.cronTask) {
            logger.info('[SubscriptionCheck] Cron scheduler is already running');
            return SubscriptionCheckService.cronTask;
        }

        // Schedule to run every day at midnight (00:00)
        SubscriptionCheckService.cronTask = cron.schedule('0 0 * * *', async () => {
            logger.info('[SubscriptionCheck] Midnight cron triggered: Running expiration checks...');
            try {
                await SubscriptionCheckService.checkAllExpirations();
            } catch (err) {
                logger.error('[SubscriptionCheck] Midnight cron execution failed', { err });
            }
        });

        logger.info('[SubscriptionCheck] Midnight subscription expiration cron service started (cron: 0 0 * * *)');
        return SubscriptionCheckService.cronTask;
    }

    /**
     * Stop the cron scheduler
     */
    static stopScheduler(): void {
        if (SubscriptionCheckService.cronTask) {
            SubscriptionCheckService.cronTask.stop();
            SubscriptionCheckService.cronTask = null;
            logger.info('[SubscriptionCheck] Cron scheduler stopped');
        }
    }
}

export default SubscriptionCheckService;
