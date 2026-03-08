import Plan from '../models/Plan';
import Organization from '../models/Organization';
import paystackService from './paystack.service';
import { SubscriptionStatus } from '../types';

/**
 * Subscription Service
 * Generic wrapper for handling multiple payment gateways
 */

/**
 * Calculate the total price for a subscription with volume discounts
 * @param basePrice Price per month
 * @param months Number of months
 * @returns Total price after discount
 */
export const calculateSubscriptionPrice = (basePrice: number, months: number): number => {
    let discount = 0;

    if (months >= 12) {
        discount = 0.20; // 20% off for 1 year+
    } else if (months >= 7) {
        discount = 0.15; // 15% off for 7-11 months
    } else if (months >= 4) {
        discount = 0.10; // 10% off for 4-6 months
    } else if (months >= 2) {
        discount = 0.05; // 5% off for 2-3 months
    }

    const total = basePrice * months;
    return Number((total * (1 - discount)).toFixed(2));
};

/**
 * Initialize a subscription
 * @param {string} email - User email
 * @param {string} organizationId - Organization ID
 * @param {string} planId - Target Plan ID
 * @param {string} [callbackUrl] - Optional callback URL
 * @param {number} [months=1] - Number of months
 * @returns {Promise<any>} Initialization data from gateway
 */
export const initializeSubscription = async (
    email: string,
    organizationId: string,
    planId: string,
    callbackUrl?: string,
    months: number = 1
) => {
    // 1. Fetch the plan
    const plan = await Plan.findById(planId);
    if (!plan) {
        throw new Error('Plan not found');
    }

    // 2. Fetch the organization to check current plan
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new Error('Organization not found');
    }

    // 3. Calculate price based on months with volume discounts
    const totalAmount = calculateSubscriptionPrice(plan.price, months);

    // 4. Determine gateway (defaulting to Paystack for now)
    const gateway = process.env.PAYMENT_GATEWAY || 'paystack';

    if (gateway === 'paystack') {
        const metadata = {
            organizationId,
            planId,
            months,
            newPlanName: plan.name,
        };

        return await paystackService.initializeSubscription(
            email,
            organizationId,
            callbackUrl,
            totalAmount,
            plan.currency,
            metadata
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

    const daysLeft = trialEndsAt
        ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    // Update status to EXPIRED if trial has ended
    if (isTrialing && isExpired) {
        organization.subscriptionStatus = SubscriptionStatus.EXPIRED;
        await organization.save();

        // Trigger notification
        try {
            const notificationService = require('./notification.service').default;
            await notificationService.sendToUser(organization.createdBy, {
                title: 'Free Trial Expired',
                message: 'Your free trial has ended. Please upgrade to a premium plan to continue using all features.',
                type: 'TRIAL_EXPIRED',
                data: { status: SubscriptionStatus.EXPIRED },
            });
        } catch (notificationError) {
            console.error('Failed to send trial expiration notification', notificationError);
        }
    } else if (isTrialing && !isExpired && daysLeft <= 3 && !organization.trialExpiryNotificationSent) {
        // Trigger Trial Near Expiry notification
        try {
            const notificationService = require('./notification.service').default;
            await notificationService.sendToUser(organization.createdBy, {
                title: 'Free Trial Nearing Expiry',
                message: `Your free trial will end in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Upgrade now to ensure uninterrupted access!`,
                type: 'TRIAL_NEAR_EXPIRY',
                data: { daysLeft, status: SubscriptionStatus.TRIALING },
            });

            // Mark as sent
            organization.trialExpiryNotificationSent = true;
            await organization.save();
        } catch (notificationError) {
            console.error('Failed to send trial near-expiry notification', notificationError);
        }
    }

    return {
        plan: organization.subscriptionPlan,
        status: organization.subscriptionStatus,
        trialEndsAt: organization.trialEndsAt,
        subscriptionEndsAt: organization.subscriptionEndsAt,
        isPremium: organization.subscriptionStatus === SubscriptionStatus.ACTIVE,
        daysLeft
    };
};

/**
 * Check if organization is eligible for SMS features (Premium only)
 * @param organizationId 
 * @returns {Promise<boolean>}
 */
export const checkSmsEligibility = async (organizationId: string): Promise<boolean> => {
    const organization = await Organization.findById(organizationId);
    if (!organization) return false;

    // Must have ACTIVE status and PREMIUM plan
    // If you have a 'free' plan, you are not eligible
    return (
        organization.subscriptionStatus === SubscriptionStatus.ACTIVE &&
        organization.subscriptionPlan === 'premium'
    );
};

const subscriptionService = {
    initializeSubscription,
    getSubscriptionStatus,
    calculateSubscriptionPrice,
    checkSmsEligibility,
};

export default subscriptionService;
