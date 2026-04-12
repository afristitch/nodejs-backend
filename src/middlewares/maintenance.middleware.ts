import { Response, NextFunction } from 'express';
import systemService from '../services/system.service';
import { errorResponse } from '../utils/response';
import { verifyAccessToken } from '../utils/jwt';
import User from '../models/User';
import { AuthRequest, UserRole } from '../types';
import logger from '../utils/logger';

/**
 * Maintenance Middleware
 * Blocks all non-SuperAdmin requests when maintenance mode is enabled
 */
const maintenanceMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const settings = await systemService.getSettings();

        // If maintenance mode is not active, proceed
        if (!settings.maintenanceMode) {
            return next();
        }

        // Exempt critical paths
        const exemptPaths = [
            '/api/v1/health',
            '/api/v1/system/maintenance',
            '/api/v1/auth/login',
        ];

        // Check if the current path is exempt
        const isExempt = exemptPaths.some(path => req.originalUrl.startsWith(path));
        if (isExempt) {
            return next();
        }

        // Check if user is a SuperAdmin (bypass attempt)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = verifyAccessToken(token);
                const user = await User.findById(decoded.userId);

                if (user && user.role === UserRole.SUPER_ADMIN) {
                    logger.info('SuperAdmin bypassing maintenance mode', { userId: user._id, url: req.originalUrl });
                    return next();
                }
            } catch (authError) {
                // Ignore auth errors here, just continue to return maintenance response
                logger.debug('Auth check failed during maintenance check', { error: authError });
            }
        }

        // Return maintenance response with custom 533 status code
        return errorResponse(
            res, 
            settings.maintenanceMessage || 'System is currently under maintenance. Please try again later.', 
            533
        );
    } catch (error) {
        logger.error('Error in maintenance middleware', { error });
        // In case of error, default to allowing the request to avoid blocking the whole app due to a settings bug
        return next();
    }
};

export default maintenanceMiddleware;
