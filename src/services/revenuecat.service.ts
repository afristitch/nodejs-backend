import Organization from '../models/Organization';
import User from '../models/User';
import Plan from '../models/Plan';
import SubscriptionPayment from '../models/SubscriptionPayment';
import { SubscriptionStatus } from '../types';

/**
 * RevenueCat Service
 * Handles webhook events from RevenueCat to keep subscription status up to date
 */

export type RevenueCatEventType =
    | 'TEST'
    | 'INITIAL_PURCHASE'
    | 'RENEWAL'
    | 'CANCELLATION'
    | 'UNCANCELLATION'
    | 'NON_RENEWING_PURCHASE'
    | 'SUBSCRIPTION_PAUSED'
    | 'EXPIRATION'
    | 'BILLING_ISSUE'
    | 'PRODUCT_CHANGE'
    | 'SUBSCRIPTION_EXTENDED'
    | 'TRANSFER';

export interface RevenueCatEvent {
    type: RevenueCatEventType;
    id: string;
    app_user_id: string;
    original_app_user_id: string;
    product_id: string;
    period_type: 'TRIAL' | 'INTRO' | 'NORMAL' | 'PROMOTIONAL' | 'PREPAID';
    purchased_at_ms: number;
    expiration_at_ms: number | null;
    price: number | null;
    price_in_purchased_currency: number | null;
    currency: string | null;
    transaction_id: string;
    environment: 'SANDBOX' | 'PRODUCTION';
    store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'RC_BILLING' | 'PROMOTIONAL';
    entitlement_ids: string[] | null;
    is_trial_conversion?: boolean;
    cancel_reason?: string;
    expiration_reason?: string;
    new_product_id?: string;
}

export interface RevenueCatWebhookBody {
    api_version: string;
    event: RevenueCatEvent;
}

/**
 * Main webhook handler — dispatches to event-specific handlers
 */
export const handleWebhook = async (body: RevenueCatWebhookBody): Promise<void> => {
    const { event } = body;

    // Skip sandbox events in production to avoid polluting real data
    if (process.env.NODE_ENV === 'production' && event.environment === 'SANDBOX') {
        console.log(`[RevenueCat] Skipping SANDBOX event: ${event.type} (${event.id})`);
        return;
    }

    const appUserId = event.app_user_id;
    const originalAppUserId = event.original_app_user_id;

    // Resolve organizationId. RevenueCat sends app_user_id which we set as the local User ID.
    // Subscriptions however are linked to Organizations in our system.
    let organizationId: string | null | undefined = null;

    // 1. Try if the ID is an organization ID directly
    const org = await Organization.findById(originalAppUserId || appUserId);
    if (org) {
        organizationId = org._id;
    } else {
        // 2. Try if the ID is a user ID
        const user = await User.findById(appUserId) || await User.findById(originalAppUserId);
        if (user) {
            organizationId = user.organizationId;
        }
    }

    if (!organizationId) {
        console.error(`[RevenueCat] Could not resolve organization for app_user_id: ${appUserId} / ${originalAppUserId}`);
        return;
    }

    // Check for idempotency using the unique RevenueCat event ID
    const isProcessed = await SubscriptionPayment.exists({
        $or: [
            { reference: `rc_event_${event.id}` },
            { "metadata.id": event.id }
        ]
    });

    if (isProcessed) {
        console.log(`[RevenueCat] Event already processed: ${event.type} (${event.id})`);
        return;
    }

    console.log(`[RevenueCat] Processing event: ${event.type} for org: ${organizationId}`);

    switch (event.type) {
        case 'TEST':
            console.log('[RevenueCat] Test webhook received OK');
            break;

        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
        case 'UNCANCELLATION':
        case 'SUBSCRIPTION_EXTENDED':
        case 'NON_RENEWING_PURCHASE':
            await handleActivation(organizationId, event);
            break;

        case 'CANCELLATION':
            await handleCancellation(organizationId, event);
            break;

        case 'EXPIRATION':
            await handleExpiration(organizationId, event);
            break;

        case 'BILLING_ISSUE':
            // Don't lock out immediately — let the subscription expire naturally
            // or let RevenueCat retry billing. Just log.
            console.warn(`[RevenueCat] Billing issue for org ${organizationId}: ${event.product_id}`);
            break;

        case 'PRODUCT_CHANGE':
            // Will apply on next RENEWAL event; just log for now
            console.log(`[RevenueCat] Product change for org ${organizationId}: ${event.product_id} → ${event.new_product_id}`);
            break;

        default:
            console.log(`[RevenueCat] Unhandled event type: ${event.type}`);
    }

    // Record the event for idempotency and auditing
    // activation already records its own payment, but we need to record others too
    if (['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE', 'PRODUCT_CHANGE', 'TEST'].includes(event.type)) {
        // Ensure we have current organization data for the planId
        const currentOrg = org || await Organization.findById(organizationId);

        await recordPayment({
            organizationId,
            planId: currentOrg?.planId || 'unknown',
            amount: 0,
            currency: event.currency || 'USD',
            months: 0,
            reference: `event_${event.id}`,
            eventType: event.type,
            event,
        });
    }
}

/**
 * Activate or extend an organization's subscription
 */
const handleActivation = async (organizationId: string, event: RevenueCatEvent): Promise<void> => {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        console.error(`[RevenueCat] Organization not found: ${organizationId}`);
        return;
    }

    const isTrial = event.period_type === 'TRIAL';

    // Update common mapping field
    const updateData: any = {
        revenuecatAppUserId: event.app_user_id,
    };

    if (isTrial) {
        // Trials are automatic and cannot be extended via webhook
        // We only link the user ID for future mapping
        console.log(`[RevenueCat] Trial event linked for org ${organizationId}, but dates preserved as per policy.`);
        await Organization.findByIdAndUpdate(organizationId, updateData);
        return;
    }

    // Handle Paid Subscriptions
    const status = SubscriptionStatus.ACTIVE;

    // Calculate expiration date from the event
    const expirationDate = event.expiration_at_ms
        ? new Date(event.expiration_at_ms)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default: +30 days if no expiry provided

    // Try to find a matching internal plan by product_id
    let plan = await Plan.findOne({ name: { $regex: event.product_id, $options: 'i' } });
    if (!plan && (event.entitlement_ids?.includes('premium') || event.entitlement_ids?.includes('pro'))) {
        plan = await Plan.findOne({ name: /premium/i, isActive: true });
    }

    // Last resort fallback
    if (!plan) {
        plan = await Plan.findOne({ isActive: true }).sort({ price: -1 });
    }

    updateData.subscriptionStatus = status;
    updateData.subscriptionEndsAt = expirationDate;

    if (plan) {
        updateData.planId = plan._id;
        updateData.subscriptionPlan = plan.name;
    }

    await Organization.findByIdAndUpdate(organizationId, updateData);

    console.log(`[RevenueCat] Subscription activated for org ${organizationId}. Ends: ${expirationDate.toISOString()}`);

    // Differentiate between initial activation and renewal
    const isRenewal = organization.subscriptionStatus === SubscriptionStatus.ACTIVE;

    // Trigger notification
    try {
        const notificationService = require('./notification.service').default;
        await notificationService.sendToUser(organization.createdBy, {
            title: isRenewal ? 'Subscription Renewed' : 'Subscription Activated',
            message: isRenewal
                ? `Your ${plan?.name || 'premium'} plan has been renewed and is now valid until ${expirationDate.toLocaleDateString()}.`
                : `Your ${plan?.name || 'premium'} plan is now active until ${expirationDate.toLocaleDateString()}.`,
            type: isRenewal ? 'SUBSCRIPTION_RENEWED' : 'SUBSCRIPTION_ACTIVATED',
            data: { planName: plan?.name, status },
        });
    } catch (error) {
        console.error('Failed to send subscription activation notification', error);
    }

    // Audit record
    await recordPayment({
        organizationId,
        planId: plan?._id || organization.planId || 'unknown',
        amount: event.price_in_purchased_currency ?? event.price ?? 0,
        currency: event.currency ?? 'USD',
        months: deriveMonths(event.purchased_at_ms, event.expiration_at_ms),
        reference: `event_${event.id}`, // Use event ID for idempotency 
        eventType: event.type,
        event,
    });
};

/**
 * Mark subscription as cancelled (still active until period end)
 */
const handleCancellation = async (organizationId: string, event: RevenueCatEvent): Promise<void> => {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        console.error(`[RevenueCat] Organization not found: ${organizationId}`);
        return;
    }

    // Mark cancelled but keep subscriptionEndsAt so access continues until period end
    await Organization.findByIdAndUpdate(organizationId, {
        subscriptionStatus: SubscriptionStatus.CANCELLED,
    });

    // Trigger notification
    try {
        const notificationService = require('./notification.service').default;
        await notificationService.sendToUser(organization.createdBy, {
            title: 'Subscription Cancelled',
            message: `Your subscription has been cancelled. You will have access until ${organization.subscriptionEndsAt?.toLocaleDateString()}.`,
            type: 'SUBSCRIPTION_CANCELLED',
            data: { status: SubscriptionStatus.CANCELLED },
        });
    } catch (error) {
        console.error('Failed to send subscription cancellation notification', error);
    }

    console.log(`[RevenueCat] Subscription cancelled for org ${organizationId}. Reason: ${event.cancel_reason}`);
};

/**
 * Mark subscription as expired (no more access)
 */
const handleExpiration = async (organizationId: string, event: RevenueCatEvent): Promise<void> => {
    await Organization.findByIdAndUpdate(organizationId, {
        subscriptionStatus: SubscriptionStatus.EXPIRED,
    });

    // We need the organization to get the owner
    const organization = await Organization.findById(organizationId);
    if (organization) {
        // Trigger notification
        try {
            const notificationService = require('./notification.service').default;
            await notificationService.sendToUser(organization.createdBy, {
                title: 'Subscription Expired',
                message: 'Your subscription has expired. Please renew to continue using all features.',
                type: 'SUBSCRIPTION_EXPIRED',
                data: { status: SubscriptionStatus.EXPIRED },
            });
        } catch (error) {
            console.error('Failed to send subscription expiration notification', error);
        }
    }

    console.log(`[RevenueCat] Subscription expired for org ${organizationId}. Reason: ${event.expiration_reason}`);
};

/**
 * Derive rough month count from timestamps
 */
const deriveMonths = (purchasedAtMs: number, expirationAtMs: number | null): number => {
    if (!expirationAtMs) return 1;
    const diffMs = expirationAtMs - purchasedAtMs;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.round(diffDays / 30));
};

/**
 * Save an audit payment record
 */
const recordPayment = async (data: {
    organizationId: string;
    planId: string;
    amount: number;
    currency: string;
    months: number;
    reference: string;
    eventType: string;
    event: RevenueCatEvent;
}): Promise<void> => {
    try {
        await SubscriptionPayment.create({
            organizationId: data.organizationId,
            planId: data.planId,
            amount: data.amount,
            currency: data.currency,
            months: data.months,
            status: 'success',
            reference: `rc_${data.reference}`,
            gateway: 'revenuecat',
            metadata: {
                ...data.event,
                eventType: data.eventType,
            },
        });
    } catch (auditError: any) {
        // Don't fail the webhook if only the audit log fails (e.g. duplicate reference on retry)
        console.error('[RevenueCat] Audit log error:', auditError.message);
    }
};

const revenuecatService = {
    handleWebhook,
};

export default revenuecatService;
