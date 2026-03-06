import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import validate from '../middlewares/validate.middleware';
import protect from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register organization with admin user
 * @access  Public
 */
router.post(
    '/register',
    [
        // Organization validation
        body('organization.name').trim().notEmpty().withMessage('Organization name is required'),
        body('organization.email').isEmail().withMessage('Valid organization email is required'),
        body('organization.phone').optional().trim(),

        // User validation
        body('user.name').trim().notEmpty().withMessage('User name is required'),
        body('user.email').isEmail().withMessage('Valid user email is required'),
        body('user.password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

        validate,
    ],
    authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
        validate,
    ],
    authController.login
);

/**
 * @route   GET /api/v1/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @route   POST /api/v1/auth/request-password-reset
 * @desc    Request password reset
 * @access  Public
 */
router.post(
    '/request-password-reset',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        validate,
    ],
    authController.requestPasswordReset
);

/**
 * @route   POST /api/v1/auth/reset-password/:token
 * @desc    Reset password
 * @access  Public
 */
router.post(
    '/reset-password/:token',
    [
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        validate,
    ],
    authController.resetPassword
);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
    '/refresh-token',
    [
        body('refreshToken').notEmpty().withMessage('Refresh token is required'),
        validate,
    ],
    authController.refreshToken
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post(
    '/resend-verification',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        validate,
    ],
    authController.resendVerification
);

/**
 * @route   PUT /api/v1/auth/update-password
 * @desc    Update password
 * @access  Private
 */
router.put(
    '/update-password',
    protect,
    [
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
        validate,
    ],
    authController.updatePassword
);

export default router;
