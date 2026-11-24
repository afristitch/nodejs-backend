import Organization from '../models/Organization';
import User from '../models/User';
import notificationService from './notification.service';
import { sendSubscriptionExpiringEmail, sendSubscriptionExpiredEmail } from '../utils/email';
import { SubscriptionStatus } from '../types';
import logger from '../utils/logger';

/**
 * Service to check subscriptions and send expiration notifications
 * Milestones: 5 days before, 1 day before, and day of expiration (0 days)
 * Channels: In-app notification, Push notification (lock screen), and Email
 */
export class SubscriptionCheckService {
    /**
     * Check all active/trialing organizations and trigger notifications for upcoming/passed expirations
     */
    static async checkAllExpirations(): Promise<{ checked: number; notified5Days: number; notified1Day: number; notifiedExpired: number }> {
        logger.info('[SubscriptionCheck] Running expiration checks...');
        const stats = { checked: 0, notified5Days: 0, notified1Day: 0, notifiedExpired: 0 };

        try {
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
                const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                // Fetch owner user for notifications
                const owner = await User.findById(org.createdBy);
                if (!owner) continue;

                const reminders = (org as any).subscriptionRemindersSent || {};
                let updated = false;

                // 1. Milestone: 5 Days Before
                if (daysLeft <= 5 && daysLeft > 1) {
                    const alreadySent5Days = reminders.fiveDays && (now - new Date(reminders.fiveDays).getTime()) < 30 * 24 * 60 * 60 * 1000;
                    if (!alreadySent5Days) {
                        logger.info(`[SubscriptionCheck] Sending 5-day expiration notice for org ${org.name} (${org._id})`);
                        // Push & In-app
                        await notificationService.sendToUser(owner._id.toString(), {
                            title: 'Subscription Expiring in 5 Days',
                            message: `Your subscription for ${org.name} expires in 5 days. Tap to renew now.`,
                            type: 'SUBSCRIPTION_EXPIRING_5_DAYS',
                            data: { daysLeft: 5, orgId: org._id.toString() }
                        });

                        // Email
                        if (owner.email) {
                            await sendSubscriptionExpiringEmail(owner.email, owner.name, 5, org.subscriptionEndsAt, org.name);
                        }

                        if (!(org as any).subscriptionRemindersSent) {
                            (org as any).subscriptionRemindersSent = {};
                        }
                        (org as any).subscriptionRemindersSent.fiveDays = new Date();
                        updated = true;
                        stats.notified5Days++;
                    }
                }

                // 2. Milestone: 1 Day Before (Tomorrow)
                else if (daysLeft <= 1 && daysLeft > 0) {
                    const alreadySent1Day = reminders.oneDay && (now - new Date(reminders.oneDay).getTime()) < 15 * 24 * 60 * 60 * 1000;
                    if (!alreadySent1Day) {
                        logger.info(`[SubscriptionCheck] Sending 1-day expiration notice for org ${org.name} (${org._id})`);
                        // Push & In-app
                        await notificationService.sendToUser(owner._id.toString(), {
                            title: '⚠️ Subscription Expires Tomorrow',
                            message: `Your subscription for ${org.name} expires tomorrow! Renew today to keep your shop running.`,
                            type: 'SUBSCRIPTION_EXPIRING_1_DAY',
                            data: { daysLeft: 1, orgId: org._id.toString() }
                        });

                        // Email
                        if (owner.email) {
                            await sendSubscriptionExpiringEmail(owner.email, owner.name, 1, org.subscriptionEndsAt, org.name);
                        }

                        if (!(org as any).subscriptionRemindersSent) {
                            (org as any).subscriptionRemindersSent = {};
                        }
                        (org as any).subscriptionRemindersSent.oneDay = new Date();
                        updated = true;
                        stats.notified1Day++;
                    }
                }

                // 3. Milestone: Day of Expiration / Expired (0 or negative days)
                else if (daysLeft <= 0) {
                    const alreadySentExpired = reminders.expired && (now - new Date(reminders.expired).getTime()) < 15 * 24 * 60 * 60 * 1000;
                    if (!alreadySentExpired) {
                        logger.info(`[SubscriptionCheck] Sending expired notice for org ${org.name} (${org._id})`);
                        
                        if (org.subscriptionStatus !== SubscriptionStatus.EXPIRED) {
                            org.subscriptionStatus = SubscriptionStatus.EXPIRED;
                        }

                        // Push & In-app
                        await notificationService.sendToUser(owner._id.toString(), {
                            title: 'Subscription Expired Today',
                            message: `Your subscription for ${org.name} has expired. Renew your plan to restore full access.`,
                            type: 'SUBSCRIPTION_EXPIRED',
                            data: { daysLeft: 0, orgId: org._id.toString() }
                        });

                        // Email
                        if (owner.email) {
                            await sendSubscriptionExpiredEmail(owner.email, owner.name, org.name);
                        }

                        if (!(org as any).subscriptionRemindersSent) {
                            (org as any).subscriptionRemindersSent = {};
                        }
                        (org as any).subscriptionRemindersSent.expired = new Date();
                        updated = true;
                        stats.notifiedExpired++;
                    }
                }

                if (updated) {
                    await org.save();
                }
            }

            logger.info('[SubscriptionCheck] Expiration check completed', stats);
            return stats;
        } catch (error) {
            logger.error('[SubscriptionCheck] Error checking subscription expirations', { error });
            return stats;
        }
    }

    /**
     * Start the recurring cron/interval (runs daily)
     */
    static startScheduler(): NodeJS.Timeout {
        // Run initial check shortly after startup (10 seconds)
        setTimeout(() => {
            SubscriptionCheckService.checkAllExpirations().catch(err => {
                logger.error('[SubscriptionCheck] Startup check failed', { err });
            });
        }, 10000);

        // Run check every 6 hours (to accurately catch milestone changes)
        const INTERVAL_MS = 6 * 60 * 60 * 1000;
        const intervalId = setInterval(() => {
            SubscriptionCheckService.checkAllExpirations().catch(err => {
                logger.error('[SubscriptionCheck] Scheduled check failed', { err });
            });
        }, INTERVAL_MS);

        logger.info('[SubscriptionCheck] Scheduled expiration checker started (every 6 hours)');
        return intervalId;
    }
}

export default SubscriptionCheckService;
