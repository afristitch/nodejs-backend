import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole, SubscriptionPlan } from '../types';
import Organization from '../models/Organization';
import OrganizationMembership from '../models/OrganizationMembership';

/**
 * Organization Middleware
 * Ensures data isolation by injecting organizationId into requests
 * and verifying that the user belongs to the requested organization if applicable
 */
export const organizationMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
    if (!req.user) return next(); // Should be caught by authMiddleware

    // Extract from header or params
    const orgId = req.headers['x-organization-id'] as string || req.params.orgId;

    if (!orgId) {
        return res.status(400).json({
            success: false,
            message: 'x-organization-id header is required',
        });
    }

    try {
        const membership = await OrganizationMembership.findOne({
            userId: req.user._id,
            organizationId: orgId,
            status: 'active'
        });

        // Super Admin bypass
        if (!membership && !req.membershipRole) {
            // Note: SuperAdmin might not have a membership. 
            // In a real system, SuperAdmin logic might be separate. 
            // For now, we strict enforce memberships.
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have access to this organization.',
            });
        }

        if (membership) {
            req.organizationId = membership.organizationId;
            req.membershipRole = membership.role as UserRole;
        }

        if (req.membershipRole === UserRole.STAFF && req.organizationId) {
            const org = await Organization.findById(req.organizationId);
            
            const now = new Date();
            const endsAt = org?.subscriptionEndsAt;
            const isExpired = endsAt && endsAt < now;

            if (org && (org.subscriptionPlan === SubscriptionPlan.FREE || org.subscriptionPlan === 'free' || isExpired)) {
                if (!req.originalUrl.includes('/profile/me')) {
                    return res.status(403).json({
                        success: false,
                        message: 'Organization subscription is inactive. Please contact your admin.',
                    });
                }
            }
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error validating organization access',
        });
    }
};
