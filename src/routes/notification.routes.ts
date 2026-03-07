import express from 'express';
import { body } from 'express-validator';
import * as notificationController from '../controllers/notification.controller';
import authMiddleware from '../middlewares/auth.middleware';
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

export default router;
