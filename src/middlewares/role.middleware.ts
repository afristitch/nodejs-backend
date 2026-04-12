import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';

/**
 * Role Middleware
 * Restricts access based on user role
 */

/**
 * Require ORG_ADMIN role
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user || (req.user.role !== UserRole.ORG_ADMIN && req.user.role !== UserRole.SUPER_ADMIN)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.',
        });
    }
    next();
};

/**
 * Require SUPER_ADMIN role
 */
export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user || req.user.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Super Admin privileges required.',
        });
    }
    next();
};

/**
 * Require specific role(s)
 */
export const requireRole = (roles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Requires one of these roles: ${roles.join(', ')}`,
            });
        }
        next();
    };
};
