import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';

/**
 * Organization Middleware
 * Ensures data isolation by injecting organizationId into requests
 * and verifying that the user belongs to the requested organization if applicable
 */
export const organizationMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
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

    next();
};
