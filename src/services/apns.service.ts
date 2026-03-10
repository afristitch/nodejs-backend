import apn from 'node-apn';
import apnProvider from '../config/apns';
import logger from '../utils/logger';
import DeviceToken from '../models/DeviceToken';

/**
 * APNS Service
 * Handles interactions with Apple Push Notification service (APNS)
 */
class ApnsService {
    /**
     * Send a single push notification via APNS
     */
    async sendPushNotification(
        token: string,
        title: string,
        body: string,
        data: any = {}
    ): Promise<boolean> {
        try {
            if (!apnProvider) {
                logger.warn('Push notification skipped: APNS Provider not initialized');
                return false;
            }

            const notification = new apn.Notification();
            notification.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires in 1 hour
            notification.badge = 3;
            notification.sound = 'ping.aiff';
            notification.alert = {
                title,
                body,
            };
            notification.payload = data;
            notification.topic = process.env.APNS_BUNDLE_ID || 'com.jimmy.sewdigital';

            const result = await apnProvider.send(notification, token);

            if (result.failed.length > 0) {
                const failure = result.failed[0];
                logger.error('APNS notification failed', {
                    token,
                    status: failure.status,
                    response: failure.response,
                });

                // Handle specific APNS errors (e.g., expired tokens)
                if (failure.status === '410' || failure.status === '400') {
                    logger.warn('APNS token is no longer valid, removing', { token });
                    await DeviceToken.deleteOne({ token });
                }
                return false;
            }

            logger.info('APNS push notification sent successfully', { token, title });
            return true;
        } catch (error) {
            logger.error('Error sending APNS push notification', { error, token });
            return false;
        }
    }

    /**
     * Send notifications to multiple iOS tokens
     */
    async sendMulticastNotification(
        tokens: string[],
        title: string,
        body: string,
        data: any = {}
    ): Promise<void> {
        try {
            if (!apnProvider || tokens.length === 0) return;

            // apn library can handle multiple tokens by sending them individually in a loop
            // or we can just map over them and call sendPushNotification
            const promises = tokens.map(token => this.sendPushNotification(token, title, body, data));
            await Promise.all(promises);

            logger.info('APNS multicast notifications processed', { count: tokens.length });
        } catch (error) {
            logger.error('Error sending APNS multicast notification', { error });
        }
    }
}

export default new ApnsService();
