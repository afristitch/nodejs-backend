import { Response, NextFunction } from 'express';
import Organization from '../models/Organization';
import { AuthRequest } from '../types';

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
            organization.subscriptionPlan = 'free';
            // @ts-ignore
            organization.subscriptionEndsAt = null;
            await organization.save();
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
