import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import User from '../models/User';
import { AuthRequest } from '../types';

/**
 * Auth Middleware
 * Verifies JWT access token and attaches user to request
 */
const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(403).json({
                success: false,
                message: 'Authentication required',
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists',
            });
        }

        if (!user.isEmailVerified && process.env.NODE_ENV === 'production') {
            return res.status(402).json({
                success: false,
                message: 'Please verify your email address',
            });
        }

        req.user = user as any;
        req.organizationId = user.organizationId;

        next();
    } catch (error: any) {
        const isExpired = error.name === 'TokenExpiredError' || error.message?.includes('jwt expired');
        return res.status(isExpired ? 401 : 403).json({
            success: false,
            message: isExpired ? 'Token has expired' : (error.message || 'Invalid token'),
        });
    }
};

export default authMiddleware;
