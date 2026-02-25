import express from 'express';
import * as uploadController from '../controllers/upload.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { organizationMiddleware } from '../middlewares/organization.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';

import subscriptionMiddleware from '../middlewares/subscription.middleware';

const router = express.Router();

// Apply auth, organization and subscription middleware to all routes
router.use(authMiddleware);
router.use(organizationMiddleware);
router.use(subscriptionMiddleware);


/**
 * @route   POST /api/v1/upload
 * @desc    Upload a single image to Cloudinary
 * @access  Private
 * @body    multipart/form-data with field "image"
 * @query   folder (optional) - Cloudinary folder, defaults to "tailor/uploads"
 * @returns { url: string, publicId: string }
 */
router.post('/', uploadSingle, uploadController.uploadImage);

export default router;
