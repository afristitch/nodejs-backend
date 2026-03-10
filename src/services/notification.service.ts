import Notification from '../models/Notification';
import DeviceToken from '../models/DeviceToken';
import firebaseService from './firebase.service';
import apnsService from './apns.service';
import logger from '../utils/logger';
import { INotification } from '../types';

/**
 * Notification Service
 * Manages the full lifecycle of notifications and device tokens
 */
class NotificationService {
    /**
     * Register or update a device token for a user
     */
    async registerDeviceToken(
        userId: string,
        token: string,
        platform: 'ios' | 'android' | 'web'
    ): Promise<void> {
        try {
            // Upsert the token
            await DeviceToken.findOneAndUpdate(
                { token },
                { userId, platform, lastUsedAt: new Date() },
                { upsert: true, new: true }
            );
            logger.info('Device token registered/updated', { userId, platform });
        } catch (error) {
            logger.error('Error registering device token', { error, userId });
            throw error;
        }
    }

    /**
     * Remove a device token (e.g., on logout)
     */
    async unregisterDeviceToken(token: string): Promise<void> {
        try {
            await DeviceToken.deleteOne({ token });
            logger.info('Device token unregistered', { token });
        } catch (error) {
            logger.error('Error unregistering device token', { error, token });
            throw error;
        }
    }

    /**
     * Send a notification to a specific user
     */
    async sendToUser(
        userId: string,
        notificationData: {
            title: string;
            message: string;
            type: string;
            data?: any;
        }
    ): Promise<void> {
        try {
            // 1. Save in-app notification
            const notification = await Notification.create({
                userId,
                ...notificationData,
            });

            // 2. Fetch user's active device tokens
            const deviceTokens = await DeviceToken.find({ userId });

            if (deviceTokens.length === 0) {
                logger.info('No device tokens found for user, skipped push message', { userId });
                return;
            }

            // 3. Send push notifications to all devices
            const iosTokens = deviceTokens.filter(dt => dt.platform === 'ios').map(dt => dt.token);
            const androidTokens = deviceTokens.filter(dt => dt.platform === 'android').map(dt => dt.token);

            // FCM data fields must be strings
            const stringifiedData: Record<string, string> = {
                notificationId: notification._id.toString(),
                type: notificationData.type,
            };

            if (notificationData.data) {
                Object.entries(notificationData.data).forEach(([key, value]) => {
                    stringifiedData[key] = String(value);
                });
            }

            // Send to Android via FCM (multicast)
            if (androidTokens.length > 0) {
                await firebaseService.sendMulticastNotification(
                    androidTokens,
                    notificationData.title,
                    notificationData.message,
                    stringifiedData
                );
            }

            // Send to iOS via APNS
            if (iosTokens.length > 0) {
                await apnsService.sendMulticastNotification(
                    iosTokens,
                    notificationData.title,
                    notificationData.message,
                    notificationData.data || {}
                );
            }
        } catch (error) {
            logger.error('Error sending notification to user', { error, userId });
        }
    }

    /**
     * Get user's notification history
     */
    async getUserNotifications(
        userId: string,
        limit: number = 20,
        page: number = 1
    ): Promise<{ notifications: INotification[]; total: number }> {
        try {
            const skip = (page - 1) * limit;
            const [notifications, total] = await Promise.all([
                Notification.find({ userId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Notification.countDocuments({ userId }),
            ]);

            return { notifications: notifications as INotification[], total };
        } catch (error) {
            logger.error('Error fetching user notifications', { error, userId });
            throw error;
        }
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId: string, userId: string): Promise<void> {
        try {
            await Notification.updateOne(
                { _id: notificationId, userId },
                { isRead: true }
            );
        } catch (error) {
            logger.error('Error marking notification as read', { error, notificationId });
            throw error;
        }
    }

    /**
     * Mark all user notifications as read
     */
    async markAllAsRead(userId: string): Promise<void> {
        try {
            await Notification.updateMany(
                { userId, isRead: false },
                { isRead: true }
            );
        } catch (error) {
            logger.error('Error marking all notifications as read', { error, userId });
            throw error;
        }
    }
}

export default new NotificationService();
