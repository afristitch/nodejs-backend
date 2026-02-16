import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/response';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication
 */

/**
 * Register organization with admin user
 * POST /api/v1/auth/register
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { organization, user } = req.body;

        const result = await authService.registerOrganization(organization, user);

        successResponse(
            res,
            result,
            'Organization registered successfully. Please verify your email.',
            201
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const result = await authService.login(email, password);

        successResponse(res, result, 'Login successful');
    } catch (error: any) {
        if (error.message === 'Invalid credentials') {
            errorResponse(res, 'Invalid email or password', 401);
            return;
        }
        next(error);
    }
};

/**
 * Verify email
 * GET /api/v1/auth/verify-email/:token
 */
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.params.token as string;

        await authService.verifyEmail(token);

        successResponse(res, null, 'Email verified successfully');
    } catch (error: any) {
        if (error.message.includes('expired')) {
            errorResponse(res, 'Verification link has expired', 400);
            return;
        }
        if (error.message.includes('already verified')) {
            errorResponse(res, 'Email already verified', 400);
            return;
        }
        next(error);
    }
};

/**
 * Request password reset
 * POST /api/v1/auth/request-password-reset
 */
export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        await authService.requestPasswordReset(email);

        successResponse(
            res,
            null,
            'If that email exists, a password reset link has been sent'
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Reset password
 * POST /api/v1/auth/reset-password/:token
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.params.token as string;
        const { password } = req.body;

        await authService.resetPassword(token, password);

        successResponse(res, null, 'Password reset successfully');
    } catch (error: any) {
        if (error.message.includes('expired')) {
            errorResponse(res, 'Reset link has expired', 400);
            return;
        }
        next(error);
    }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh-token
 */
export const refreshToken = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const { refreshToken } = req.body;

        const result = await authService.refreshAccessToken(refreshToken);

        successResponse(res, result, 'Token refreshed successfully');
    } catch (error) {
        errorResponse(res, 'Invalid or expired refresh token', 401);
    }
};
