import express from 'express';
import * as profileController from '../controllers/profile.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { organizationMiddleware } from '../middlewares/organization.middleware';
import subscriptionMiddleware from '../middlewares/subscription.middleware';

const router = express.Router();

// Apply auth and organization middleware to all routes
router.use(authMiddleware);
router.use(organizationMiddleware);

/**
 * @route   GET /api/v1/profile/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/me', profileController.getMyProfile);

// Apply subscription middleware to subsequent routes
router.use(subscriptionMiddleware);


/**
 * @route   PUT /api/v1/profile/me
 * @desc    Update current user's profile (name, email, photo)
 * @access  Private
 */
router.put('/me', profileController.updateMyProfile);


export default router;
