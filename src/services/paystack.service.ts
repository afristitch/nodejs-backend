import Organization from '../models/Organization';
import { SubscriptionStatus } from '../types';


const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';


/**
 * Paystack Service
 * Handles interactions with Paystack API for payments and subscriptions
 */

/**
 * @param {string} email - Customer email
 * @param {string} organizationId - Organization ID for reference
 * @param {string} [callbackUrl] - Optional custom callback URL (e.g., deep link)
 * @param {number} [amount=0] - Amount in base currency (e.g., GHS)
 * @param {string} [currency='GHS'] - Currency code
 * @returns {Promise<any>} Paystack initialization response
 */
export const initializeSubscription = async (
    email: string,
    organizationId: string,
    callbackUrl?: string,
    amount: number = 0,
    currency: string = 'GHS'
) => {

    const response = await fetch('https://api.paystack.co/transaction/initialize', {

        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            amount: (amount * 100).toString(), // Paystack uses kobo/pesewas
            currency,
            reference: `sub_${organizationId}_${Date.now()}`,
            callback_url: callbackUrl || `${process.env.FRONTEND_URL}/subscription/verify`,
            metadata: {
                organizationId,
            },
        }),

    });

    const data = (await response.json()) as any;
    if (!data.status) {
        throw new Error(data.message || 'Failed to initialize Paystack transaction');
    }

    return data.data;

};

/**
 * Verify a transaction
 * @param {string} reference - Paystack transaction reference
 * @returns {Promise<any>} Paystack verification response
 */
export const verifyTransaction = async (reference: string) => {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
    });

    const data = (await response.json()) as any;
    if (!data.status) {
        throw new Error(data.message || 'Failed to verify Paystack transaction');
    }

    return data.data;

};

/**
 * Handle Paystack Webhook
 * @param {any} event - Paystack webhook event object
 */
export const handleWebhook = async (event: any) => {
    const { event: eventType, data } = event;

    // Handle successful payment
    if (eventType === 'charge.success') {
        const organizationId = data.metadata?.organizationId;

        if (organizationId) {
            await updateSubscriptionStatus(organizationId, data);
        }
    }
};


/**
 * Update organization subscription status in database
 * @param {string} organizationId 
 * @param {any} subscriptionData 
 */
const updateSubscriptionStatus = async (organizationId: string, paymentData: any) => {
    // For one-time payments, we assume monthly for now
    const subscriptionEndsAt = new Date();
    subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + 30);

    await Organization.findByIdAndUpdate(organizationId, {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        paystackCustomerCode: paymentData.customer?.customer_code,
        subscriptionEndsAt,
    });
};


const paystackService = {
    initializeSubscription,
    verifyTransaction,
    handleWebhook,
};

export default paystackService;
