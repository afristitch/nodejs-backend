import Organization from '../models/Organization';
import Plan from '../models/Plan';
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
    const { planId, months = 1 } = paymentData.metadata || {};

    const organization = await Organization.findById(organizationId);
    if (!organization) {
        console.error(`Organization ${organizationId} not found during webhook`);
        return;
    }

    // Differentiate Renewal vs. Plan Change
    const isPlanRenewal = organization.planId === planId;

    // Determine new expiry date
    let startDate = new Date();
    if (isPlanRenewal && organization.subscriptionEndsAt && organization.subscriptionEndsAt > new Date()) {
        // Renewal: Extend existing active subscription
        startDate = new Date(organization.subscriptionEndsAt);
    } else {
        // Plan Change or New/Expired: Start from today
        startDate = new Date();
    }

    const subscriptionEndsAt = new Date(startDate);
    subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + (months * 30));

    const updateData: any = {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        paystackCustomerCode: paymentData.customer?.customer_code,
        subscriptionEndsAt,
    };

    // Update plan details if specified in metadata
    if (planId) {
        const plan = await Plan.findById(planId);
        if (plan) {
            updateData.planId = planId;
            updateData.subscriptionPlan = plan.name;
        }
    }

    // Perform Update
    await Organization.findByIdAndUpdate(organizationId, updateData);

    // Record Payment for Audit
    try {
        await SubscriptionPayment.create({
            organizationId,
            planId: planId || organization.planId,
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
        // We don't throw here to avoid failing the whole webhook process 
        // if just the audit log fails (though reference unique constraint should catch dupes)
    }

    console.log(`Subscription ${isPlanRenewal ? 'Renewed' : 'Changed'} for org ${organizationId}: Plan ${updateData.subscriptionPlan}, Ends: ${subscriptionEndsAt}`);
};


const paystackService = {
    initializeSubscription,
    verifyTransaction,
    handleWebhook,
};

export default paystackService;
