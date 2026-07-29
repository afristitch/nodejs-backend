import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole, SubscriptionPlan } from '../types';
import Organization from '../models/Organization';

/**
 * Organization Middleware
 * Ensures data isolation by injecting organizationId into requests
 * and verifying that the user belongs to the requested organization if applicable
 */
export const organizationMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
    // organizationId is already attached by authMiddleware
    if (!req.organizationId && req.user) {
        req.organizationId = req.user.organizationId;
    }

    // For routes with :orgId param (if added in future)
    if (req.params.orgId && req.params.orgId !== req.organizationId && req.user?.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Organization mismatch.',
        });
    }
    if (req.user?.role === UserRole.STAFF && req.organizationId) {
        const org = await Organization.findById(req.organizationId);
        
        const now = new Date();
        const endsAt = org?.subscriptionEndsAt;
        const isExpired = endsAt && endsAt < now;

        if (org && (org.subscriptionPlan === SubscriptionPlan.FREE || org.subscriptionPlan === 'free' || isExpired)) {
            return res.status(403).json({
                success: false,
                message: 'Organization subscription is inactive. Please contact your admin.',
            });
        }
    }

    next();
};
