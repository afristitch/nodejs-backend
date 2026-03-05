import express from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { organizationMiddleware } from '../middlewares/organization.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import validate from '../middlewares/validate.middleware';
import subscriptionMiddleware from '../middlewares/subscription.middleware';

const router = express.Router();

// Apply auth, organization and subscription middleware to all routes
router.use(authMiddleware);
router.use(organizationMiddleware);
router.use(subscriptionMiddleware);

/**
 * @route   POST /api/v1/users
 * @desc    Create a new user (ADMIN only)
 * @access  Private (ORG_ADMIN)
 */
router.post(
    '/',
    requireAdmin,
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').isIn(['ORG_ADMIN', 'STAFF']).withMessage('Role must be ORG_ADMIN or STAFF'),
        validate,
    ],
    userController.createUser
);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users
 * @access  Private
 */
router.get('/', userController.getUsers);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', userController.getUserById);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user (ADMIN only)
 * @access  Private (ORG_ADMIN)
 */
router.put(
    '/:id',
    requireAdmin,
    [
        body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        body('email').optional().isEmail().withMessage('Valid email is required'),
        body('role').optional().isIn(['ORG_ADMIN', 'STAFF']).withMessage('Role must be ORG_ADMIN or STAFF'),
        validate,
    ],
    userController.updateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (ADMIN only)
 * @access  Private (ORG_ADMIN)
 */
router.delete('/:id', requireAdmin, userController.deleteUser);

export default router;
