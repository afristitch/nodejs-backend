import { Response, NextFunction } from 'express';
import notificationService from '../services/notification.service';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest, UserRole } from '../types';
import User from '../models/User';
import Organization from '../models/Organization';
import OrganizationMembership from '../models/OrganizationMembership';
import { sendCustomAdminEmail, renderCustomAdminEmailHtml } from '../utils/email';

/**
 * Notification Controller
 * Handles HTTP requests for notification management
 */

/**
 * Register a device token
 * POST /api/v1/notifications/device-tokens
 */
export const registerToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { token, platform } = req.body;
        const userId = req.user?._id;

        if (!token || !platform) {
            return errorResponse(res, 'Token and platform are required', 400);
        }

        if (!['ios', 'android', 'web'].includes(platform)) {
            return errorResponse(res, 'Invalid platform. Must be ios, android, or web', 400);
        }

        await notificationService.registerDeviceToken(userId!, token, platform);

        return successResponse(res, null, 'Device token registered successfully');
    } catch (error) {
        return next(error);
    }
};

/**
 * Remove a device token
 * DELETE /api/v1/notifications/device-tokens/:token
 */
export const unregisterToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.params.token as string;

        if (!token) {
            return errorResponse(res, 'Token is required', 400);
        }

        await notificationService.unregisterDeviceToken(token);

        return successResponse(res, null, 'Device token removed successfully');
    } catch (error) {
        return next(error);
    }
};

/**
 * Get user notifications
 * GET /api/v1/notifications
 */
export const getMyNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const { notifications, total } = await notificationService.getUserNotifications(userId!, limit, page);

        return successResponse(res, {
            notifications,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        }, 'Notifications retrieved successfully');
    } catch (error) {
        return next(error);
    }
};

/**
 * Mark a notification as read
 * PATCH /api/v1/notifications/:id/read
 */
export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const userId = req.user?._id;

        await notificationService.markAsRead(id, userId!);

        return successResponse(res, null, 'Notification marked as read');
    } catch (error) {
        return next(error);
    }
};

/**
 * Mark all as read
 * PATCH /api/v1/notifications/read-all
 */
export const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?._id;

        await notificationService.markAllAsRead(userId!);

        return successResponse(res, null, 'All notifications marked as read');
    } catch (error) {
        return next(error);
    }
};

/**
 * Preview rendered email HTML using the backend email template
 * POST /api/v1/notifications/admin/preview
 */
export const previewAdminNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { title = '', message = '', recipientName = 'Tailor' } = req.body as {
            title?: string;
            message?: string;
            recipientName?: string;
        };

        const html = renderCustomAdminEmailHtml(title, message, recipientName);
        return successResponse(res, { html }, 'Preview rendered');
    } catch (error) {
        return next(error);
    }
};

/**
 * Send push notifications and/or emails from the monitoring console
 * POST /api/v1/notifications/admin/send
 */
export const sendAdminNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const {
            audience = 'all_admins',
            userId,
            channels = ['push'],
            title,
            message,
            type = 'SYSTEM_ANNOUNCEMENT',
        } = req.body as {
            audience: 'all_admins' | 'pro_admins' | 'free_admins' | 'single';
            userId?: string;
            channels: Array<'push' | 'email'>;
            title: string;
            message: string;
            type?: string;
        };

        if (!title?.trim() || !message?.trim()) {
            return errorResponse(res, 'Title and message are required', 400);
        }

        if (!Array.isArray(channels) || channels.length === 0) {
            return errorResponse(res, 'Select at least one delivery channel (push or email)', 400);
        }

        let targetUsers: Array<{ _id: string; name?: string; email?: string }> = [];

        if (audience === 'single') {
            if (!userId) {
                return errorResponse(res, 'userId is required when audience is single', 400);
            }
            const user = await User.findById(userId).select('_id name email').lean();
            if (!user) {
                return errorResponse(res, 'Target user not found', 404);
            }
            targetUsers = [user];
        } else {
            const memberships = await OrganizationMembership.find({ role: UserRole.ORG_ADMIN })
                .select('userId organizationId')
                .lean();

            let filteredUserIds: string[];

            if (audience === 'pro_admins' || audience === 'free_admins') {
                const orgIds = Array.from(new Set(memberships.map((m) => m.organizationId).filter(Boolean)));
                const orgs = await Organization.find({ _id: { $in: orgIds } })
                    .select('_id subscriptionPlan subscriptionStatus subscriptionEndsAt')
                    .lean();

                const now = Date.now();
                const proOrgIds = new Set(
                    orgs
                        .filter((o: any) => {
                            if (o.subscriptionPlan !== 'premium') return false;
                            if (o.subscriptionStatus === 'expired') return false;
                            if (o.subscriptionEndsAt && new Date(o.subscriptionEndsAt).getTime() < now) {
                                return false;
                            }
                            return true;
                        })
                        .map((o: any) => String(o._id))
                );

                filteredUserIds = Array.from(
                    new Set(
                        memberships
                            .filter((m) => {
                                const isPro = proOrgIds.has(String(m.organizationId));
                                return audience === 'pro_admins' ? isPro : !isPro;
                            })
                            .map((m) => String(m.userId))
                    )
                );
            } else {
                filteredUserIds = Array.from(new Set(memberships.map((m) => String(m.userId))));
            }

            if (filteredUserIds.length > 0) {
                targetUsers = await User.find({ _id: { $in: filteredUserIds } })
                    .select('_id name email')
                    .lean();
            }
        }

        const sendPush = channels.includes('push');
        const sendEmail = channels.includes('email');

        let pushSent = 0;
        let emailSent = 0;
        let failed = 0;

        const BATCH_SIZE = 10;
        for (let i = 0; i < targetUsers.length; i += BATCH_SIZE) {
            const batch = targetUsers.slice(i, i + BATCH_SIZE);
            await Promise.all(
                batch.map(async (target) => {
                    if (sendPush) {
                        try {
                            await notificationService.sendToUser(String(target._id), {
                                title: title.trim(),
                                message: message.trim(),
                                type,
                            });
                            pushSent += 1;
                        } catch {
                            failed += 1;
                        }
                    }

                    if (sendEmail && target.email) {
                        const ok = await sendCustomAdminEmail(
                            target.email,
                            title.trim(),
                            message.trim(),
                            target.name
                        );
                        if (ok) {
                            emailSent += 1;
                        } else {
                            failed += 1;
                        }
                    }
                })
            );
        }

        return successResponse(
            res,
            {
                targetCount: targetUsers.length,
                pushSent,
                emailSent,
                failed,
            },
            `Dispatched to ${targetUsers.length} recipient(s)`
        );
    } catch (error) {
        return next(error);
    }
};
