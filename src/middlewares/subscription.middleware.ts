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

        // Super admins bypass subscription checks
        if (req.membershipRole === 'SUPER_ADMIN') {
            return next();
        }

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
        const endsAt = organization.subscriptionEndsAt;

        if (endsAt && endsAt < now) {
            await Organization.findByIdAndUpdate(organizationId, {
                subscriptionPlan: 'free',
                subscriptionEndsAt: null,
                subscriptionStatus: SubscriptionStatus.EXPIRED,
            });
        } else if ((organization.subscriptionStatus as string) === 'trialing') {
            await Organization.findByIdAndUpdate(organizationId, {
                subscriptionStatus: SubscriptionStatus.ACTIVE,
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

/**
 * Require active Premium subscription middleware
 */
export const requirePremium = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
        if (req.membershipRole === 'SUPER_ADMIN') {
            return next();
        }

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
        if (organization.subscriptionEndsAt && organization.subscriptionEndsAt < now) {
            await Organization.findByIdAndUpdate(organizationId, {
                subscriptionPlan: 'free',
                subscriptionEndsAt: null,
                subscriptionStatus: SubscriptionStatus.EXPIRED,
            });
            return res.status(403).json({
                success: false,
                message: 'Active Premium subscription is required to access this feature',
            });
        }

        const isPro =
            organization.subscriptionStatus === SubscriptionStatus.ACTIVE &&
            organization.subscriptionPlan === 'premium';

        if (!isPro) {
            return res.status(403).json({
                success: false,
                message: 'Active Premium subscription is required to access this feature',
            });
        }

        return next();
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Error verifying premium access',
            error: error.message,
        });
    }
};

export default subscriptionMiddleware;
