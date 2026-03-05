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

        // 1. Check if trialing and expired
        if (organization.subscriptionStatus === SubscriptionStatus.TRIALING) {
            if (organization.trialEndsAt && organization.trialEndsAt < now) {
                // Auto-expire trial if we haven't already
                organization.subscriptionStatus = SubscriptionStatus.EXPIRED;
                await organization.save();

                return res.status(403).json({
                    success: false,
                    message: 'Free trial has expired. Please subscribe to continue.',
                    code: 'TRIAL_EXPIRED',
                });
            }
            return next();
        }

        // 2. Check if active subscription
        if (organization.subscriptionStatus === SubscriptionStatus.ACTIVE) {
            // Subscription status is usually updated via webhooks, 
            // but we can add a local check if subscriptionEndsAt exists
            if (organization.subscriptionEndsAt && organization.subscriptionEndsAt < now) {
                organization.subscriptionStatus = SubscriptionStatus.EXPIRED;
                await organization.save();

                return res.status(403).json({
                    success: false,
                    message: 'Subscription has expired. Please renew to continue.',
                    code: 'SUBSCRIPTION_EXPIRED',
                });
            }
            return next();
        }

        // 3. Block if expired or cancelled
        if (organization.subscriptionStatus === SubscriptionStatus.EXPIRED ||
            organization.subscriptionStatus === SubscriptionStatus.CANCELLED) {
            return res.status(403).json({
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
