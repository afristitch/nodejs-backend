import { Response, NextFunction } from 'express';
import notificationService from '../services/notification.service';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../types';

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
