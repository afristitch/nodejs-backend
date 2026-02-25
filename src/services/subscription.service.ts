import Plan from '../models/Plan';
import Organization from '../models/Organization';
import paystackService from './paystack.service';
import { SubscriptionStatus } from '../types';

/**
 * Subscription Service
 * Generic wrapper for handling multiple payment gateways
 */

/**
 * Initialize a subscription
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 * @param {string} planId - Target Plan ID
 * @param {string} [callbackUrl] - Optional callback URL
 * @returns {Promise<any>} Initialization data from gateway
 */
export const initializeSubscription = async (
    email: string,
    organizationId: string,
    planId: string,
    callbackUrl?: string
) => {
    // 1. Fetch the plan
    const plan = await Plan.findById(planId);
    if (!plan) {
        throw new Error('Plan not found');
    }

    // 2. Determine gateway (defaulting to Paystack for now)
    const gateway = process.env.PAYMENT_GATEWAY || 'paystack';

    if (gateway === 'paystack') {
        return await paystackService.initializeSubscription(
            email,
            organizationId,
            callbackUrl,
            plan.price,
            plan.currency
        );
    }


    // Future gateways can be added here
    throw new Error(`Payment gateway ${gateway} not supported`);
};

/**
 * Get current organization subscription details
 * @param {string} organizationId 
 */
export const getSubscriptionStatus = async (organizationId: string) => {
    const organization = await Organization.findById(organizationId).populate('planId');
    if (!organization) {
        throw new Error('Organization not found');
    }

    const trialEndsAt = organization.trialEndsAt;
    const isTrialing = organization.subscriptionStatus === SubscriptionStatus.TRIALING;
    const isExpired = trialEndsAt ? new Date(trialEndsAt) < new Date() : false;

    // Update status to EXPIRED if trial has ended
    if (isTrialing && isExpired) {
        organization.subscriptionStatus = SubscriptionStatus.EXPIRED;
        await organization.save();
    }

    return {
        plan: organization.subscriptionPlan,
        status: organization.subscriptionStatus,
        trialEndsAt: organization.trialEndsAt,
        subscriptionEndsAt: organization.subscriptionEndsAt,
        isPremium: organization.subscriptionStatus === SubscriptionStatus.ACTIVE,
        daysLeft: trialEndsAt
            ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : 0
    };
};

const subscriptionService = {
    initializeSubscription,
    getSubscriptionStatus,
};

export default subscriptionService;
