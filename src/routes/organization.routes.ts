import express from 'express';
import { body } from 'express-validator';
import * as organizationController from '../controllers/organization.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { organizationMiddleware } from '../middlewares/organization.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import validate from '../middlewares/validate.middleware';
import subscriptionMiddleware from '../middlewares/subscription.middleware';

const router = express.Router();

// Apply auth and organization middleware to all routes
router.use(authMiddleware);
router.use(organizationMiddleware);

router.get('/', organizationController.getOrganization);

/**
 * @route   GET /api/v1/organization/subscription
 * @desc    Get organization subscription status
 * @access  Private
 */
router.get('/subscription', organizationController.getSubscriptionStatus);


/**
 * @route   PUT /api/v1/organization
 * @desc    Update organization (ADMIN only)
 * @access  Private (ORG_ADMIN)
 */
router.put(
    '/',
    subscriptionMiddleware,
    requireAdmin,
    [
        body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email is required'),
        body('phone').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Phone cannot be empty'),
        validate,
    ],
    organizationController.updateOrganization
);

export default router;
