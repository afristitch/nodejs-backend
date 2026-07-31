import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';

/**
 * Middleware to restrict access to specific roles
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.membershipRole) {
      return res.status(403).json({
        success: false,
        message: 'Authentication required and workspace must be selected',
      });
    }

    if (!roles.includes(req.membershipRole)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.membershipRole}' is not authorized to access this resource`,
      });
    }

    return next();
  };
};

/**
 * Legacy/Shortcut middlewares for backward compatibility
 */
export const requireAdmin = authorize(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN);
export const requireSuperAdmin = authorize(UserRole.SUPER_ADMIN);
