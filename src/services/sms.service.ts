/**
 * SMS Service
 * Handles communication with mNotify API using fetch
 */

const MNOTIFY_API_KEY = process.env.MNOTIFY_API_KEY
const MNOTIFY_SENDER_ID = process.env.MNOTIFY_SENDER_ID
const MNOTIFY_BASE_URL = 'https://api.mnotify.com/api';

/**
 * Send SMS to one or more recipients
 * @param recipients Array of phone numbers
 * @param message Message content
 * @returns mNotify API response
 */
export const sendSMS = async (recipients: string[], message: string) => {
    try {
        const url = `${MNOTIFY_BASE_URL}/sms/quick?key=${MNOTIFY_API_KEY}`;

        const payload = {
            recipient: recipients,
            sender: MNOTIFY_SENDER_ID,
            message: message,
            is_schedule: false,
            schedule_date: ''
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = (await response.json()) as any;

        if (data.status !== 'success') {
            console.error('mNotify SMS Error:', data);
            throw new Error(data.message || 'Failed to send SMS');
        }

        return data;
    } catch (error: any) {
        console.error('SMS Service Error:', error.message);
        throw new Error(error.message || 'Failed to send SMS');
    }
};

const smsService = {
    sendSMS,
};

export default smsService;
