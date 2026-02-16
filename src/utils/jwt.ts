import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { JWTPayload } from '../types';

/**
 * JWT Utility Functions
 */

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (payload: JWTPayload): string => {
    const options: SignOptions = {
        expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as any,
    };
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as Secret, options);
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
    const options: SignOptions = {
        expiresIn: (process.env.JWT_REFRESH_EXPIRATION || '7d') as any,
    };
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as Secret, options);
};

/**
 * Generate email verification/reset token
 */
export const generateEmailToken = (payload: JWTPayload): string => {
    const options: SignOptions = {
        expiresIn: (process.env.JWT_EMAIL_EXPIRATION || '1h') as any,
    };
    return jwt.sign(payload, process.env.JWT_EMAIL_SECRET as Secret, options);
};

/**
 * Verify and decode a JWT token
 */
const verifyToken = (token: string, secret: string): JWTPayload => {
    try {
        return jwt.verify(token, secret as Secret) as JWTPayload;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        } else {
            throw new Error('Token verification failed');
        }
    }
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
    return verifyToken(token, process.env.JWT_ACCESS_SECRET || 'secret');
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
    return verifyToken(token, process.env.JWT_REFRESH_SECRET || 'secret');
};

/**
 * Verify email token
 */
export const verifyEmailToken = (token: string): JWTPayload => {
    return verifyToken(token, process.env.JWT_EMAIL_SECRET || 'secret');
};
