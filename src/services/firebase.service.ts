import firebaseApp from '../config/firebase';
import logger from '../utils/logger';

/**
 * Firebase Service
 * Handles interactions with Firebase Cloud Messaging (FCM)
 */
class FirebaseService {
    /**
     * Send a single push notification
     */
    async sendPushNotification(
        token: string,
        title: string,
        body: string,
        data: any = {}
    ): Promise<boolean> {
        try {
            if (!firebaseApp) {
                logger.warn('Push notification skipped: Firebase not initialized');
                return false;
            }

            const message = {
                notification: {
                    title,
                    body,
                },
                data: {
                    ...data,
                    // FCM data fields must be strings
                    click_action: 'FLUTTER_NOTIFICATION_CLICK', // Common for mobile apps
                },
                token,
            };

            await firebaseApp.messaging().send(message);
            logger.info('Push notification sent successfully', { token, title });
            return true;
        } catch (error: any) {
            // Handle specific FCM errors (e.g., expired tokens)
            if (error.code === 'messaging/registration-token-not-registered') {
                logger.warn('FCM token is no longer valid', { token });
            } else {
                logger.error('Error sending push notification', { error, token });
            }
            return false;
        }
    }

    /**
     * Send multicast push notifications (to multiple tokens)
     */
    async sendMulticastNotification(
        tokens: string[],
        title: string,
        body: string,
        data: any = {}
    ): Promise<void> {
        try {
            if (!firebaseApp || tokens.length === 0) return;

            const message = {
                notification: {
                    title,
                    body,
                },
                data,
                tokens,
            };

            const response = await firebaseApp.messaging().sendEachForMulticast(message);

            logger.info('Multicast push notifications processed', {
                successCount: response.successCount,
                failureCount: response.failureCount,
            });

            if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        logger.error('Individual multicast failure', {
                            token: tokens[idx],
                            error: resp.error
                        });
                    }
                });
            }
        } catch (error) {
            logger.error('Error sending multicast notification', { error });
        }
    }
}

export default new FirebaseService();
