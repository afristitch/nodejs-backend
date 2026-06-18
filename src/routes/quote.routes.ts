import express from 'express';
import quoteController from '../controllers/quote.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { organizationMiddleware } from '../middlewares/organization.middleware';
import { body } from 'express-validator';
import validate from '../middlewares/validate.middleware';

const router = express.Router();

// All quote management routes require authentication and org context
router.use(authMiddleware);
router.use(organizationMiddleware);

/**
 * @route   GET /api/v1/quotes
 * @desc    List inquiries for the studio
 * @access  Private
 */
router.get('/', quoteController.listInquiries);

/**
 * @route   PATCH /api/v1/quotes/:id/respond
 * @desc    Send a professional quote response
 * @access  Private
 */
router.patch(
    '/:id/respond',
    [
        body('amount').isNumeric().withMessage('Total amount is required'),
        body('items').isArray({ min: 1 }).withMessage('At least one line item is required'),
        validate
    ],
    quoteController.respondInquiry
);

export default router;
