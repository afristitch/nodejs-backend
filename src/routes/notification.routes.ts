import express from 'express';
import { body } from 'express-validator';
import * as notificationController from '../controllers/notification.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { requireSuperAdmin } from '../middlewares/role.middleware';
import validate from '../middlewares/validate.middleware';

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/v1/notifications/device-tokens
 * @desc    Register a device token for push notifications
 * @access  Private
 */
router.post(
    '/device-tokens',
    [
        body('token').notEmpty().withMessage('Token is required'),
        body('platform').isIn(['ios', 'android', 'web']).withMessage('Invalid platform'),
    ],
    validate,
    notificationController.registerToken
);

/**
 * @route   DELETE /api/v1/notifications/device-tokens/:token
 * @desc    Unregister a device token
 * @access  Private
 */
router.delete('/device-tokens/:token', notificationController.unregisterToken);

/**
 * @route   GET /api/v1/notifications
 * @desc    Get current user's notification history
 * @access  Private
 */
router.get('/', notificationController.getMyNotifications);

/**
 * @route   PATCH /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/read-all', notificationController.markAllAsRead);

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Mark a specific notification as read
 * @access  Private
 */
router.patch('/:id/read', notificationController.markAsRead);

/**
 * @route   POST /api/v1/notifications/admin/preview
 * @desc    Preview rendered email template HTML (Super Admin)
 * @access  Private (SUPER_ADMIN)
 */
router.post(
    '/admin/preview',
    requireSuperAdmin,
    notificationController.previewAdminNotification
);

/**
 * @route   POST /api/v1/notifications/admin/send
 * @desc    Send push notifications and/or emails to business admins (Super Admin)
 * @access  Private (SUPER_ADMIN)
 */
router.post(
    '/admin/send',
    requireSuperAdmin,
    [
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('message').trim().notEmpty().withMessage('Message is required'),
        body('audience')
            .optional()
            .isIn(['all_admins', 'pro_admins', 'free_admins', 'single'])
            .withMessage('Invalid audience'),
        body('channels')
            .isArray({ min: 1 })
            .withMessage('At least one channel is required'),
    ],
    validate,
    notificationController.sendAdminNotification
);

export default router;
