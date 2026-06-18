import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';

/**
 * Middleware to restrict access to specific roles
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this resource`,
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
