import { Response, NextFunction } from 'express';
import Organization from '../models/Organization';
import { AuthRequest, SubscriptionStatus } from '../types';

/**
 * Subscription Middleware
 * Checks if the organization has an active trial or subscription
 */
const subscriptionMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
        const organizationId = req.organizationId;

        if (!organizationId) {
            return res.status(403).json({
                success: false,
                message: 'Organization context missing',
            });
        }

        const organization = await Organization.findById(organizationId);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
        }

        const now = new Date();

        const isTrialing = organization.subscriptionStatus === SubscriptionStatus.TRIALING;
        const isActive = organization.subscriptionStatus === SubscriptionStatus.ACTIVE;

        if (isTrialing || isActive) {
            const endsAt = organization.subscriptionEndsAt;
            if (endsAt && endsAt < now) {
                organization.subscriptionStatus = SubscriptionStatus.EXPIRED;
                await organization.save();

                const message = isTrialing
                    ? 'Free trial has expired. Please subscribe to continue.'
                    : 'Subscription has expired. Please renew to continue.';
                const code = isTrialing ? 'TRIAL_EXPIRED' : 'SUBSCRIPTION_EXPIRED';

                return res.status(406).json({ success: false, message, code });
            }
            return next();
        }

        // 3. Block if expired or cancelled
        if (organization.subscriptionStatus === SubscriptionStatus.EXPIRED ||
            organization.subscriptionStatus === SubscriptionStatus.CANCELLED) {
            return res.status(406).json({
                success: false,
                message: 'Access denied. Please subscribe to a plan to continue.',
                code: 'NO_ACTIVE_SUBSCRIPTION',
            });
        }

        next();
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Error verifying subscription status',
            error: error.message,
        });
    }
};

export default subscriptionMiddleware;
