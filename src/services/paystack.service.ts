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
    currency: string = 'GHS',
    metadata: any = {}
) => {

    const body: any = {
        email,
        amount: Math.round(amount * 100), // Paystack uses kobo/pesewas (must be integer)
        currency,
        reference: `sub_${organizationId}_${Date.now()}`,
        callback_url: callbackUrl || `${process.env.FRONTEND_URL}/subscription/verify`,
        metadata: {
            ...metadata,
            organizationId,
        },
    };

    const response = await fetch('https://api.paystack.co/transaction/initialize', {

        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),

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


import SubscriptionPayment from '../models/SubscriptionPayment';


/**
 * Update organization subscription status in database
 * @param {string} organizationId 
 * @param {any} subscriptionData 
 */
const updateSubscriptionStatus = async (organizationId: string, paymentData: any) => {
    const { months = 1 } = paymentData.metadata || {};

    const organization = await Organization.findById(organizationId);
    if (!organization) {
        console.error(`Organization ${organizationId} not found during webhook`);
        return;
    }

    const isAlreadyActive = organization.subscriptionStatus === SubscriptionStatus.ACTIVE && 
                            organization.subscriptionEndsAt && 
                            new Date(organization.subscriptionEndsAt) > new Date();

    let startDate = isAlreadyActive ? new Date(organization.subscriptionEndsAt!) : new Date();

    const subscriptionEndsAt = new Date(startDate);
    subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + (months * 30));

    const updateData: any = {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionPlan: 'premium',
        subscriptionEndsAt,
    };

    // Perform Update
    await Organization.findByIdAndUpdate(organizationId, updateData);

    // Trigger notification
    try {
        const notificationService = require('./notification.service').default;
        await notificationService.sendToUser(organization.createdBy, {
            title: isAlreadyActive ? 'Subscription Renewed' : 'Subscription Activated',
            message: `Your premium plan is now active until ${subscriptionEndsAt.toLocaleDateString()}.`,
            type: isAlreadyActive ? 'SUBSCRIPTION_RENEWED' : 'SUBSCRIPTION_ACTIVATED',
            data: { planName: 'premium', status: SubscriptionStatus.ACTIVE },
        });
    } catch (error) {
        console.error('Failed to send subscription notification (Paystack)', error);
    }

    // Record Payment for Audit
    try {
        await SubscriptionPayment.create({
            organizationId,
            planId: organization.planId || 'premium',
            amount: paymentData.amount / 100, // Convert from kobo/pesewas
            currency: paymentData.currency,
            months,
            status: 'success',
            reference: paymentData.reference,
            gateway: 'paystack',
            metadata: paymentData,
        });
    } catch (auditError) {
        console.error('Audit Error:', auditError);
    }

    console.log(`Subscription updated for org ${organizationId}: Plan premium, Ends: ${subscriptionEndsAt}`);
};


const paystackService = {
    initializeSubscription,
    verifyTransaction,
    handleWebhook,
};

export default paystackService;
