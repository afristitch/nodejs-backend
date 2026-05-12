import express from 'express';
import exploreController from '../controllers/explore.controller';
import { body } from 'express-validator';
import validate from '../middlewares/validate.middleware';

const router = express.Router();

/**
 * @route   GET /api/v1/explore
 * @desc    List all public studios
 * @access  Public
 */
router.get('/', exploreController.listStudios);

/**
 * @route   GET /api/v1/explore/:id
 * @desc    Get public studio details
 * @access  Public
 */
router.get('/:id', exploreController.getStudio);

/**
 * @route   POST /api/v1/explore/quote
 * @desc    Submit a quote request
 * @access  Public
 */
router.post(
    '/quote',
    [
        body('tailorId').notEmpty().withMessage('Tailor ID is required'),
        body('details').notEmpty().withMessage('Inquiry details are required'),
        // Validate guestInfo if no customerId
        body('guestInfo').if(body('customerId').not().exists()).notEmpty().withMessage('Contact info is required for guests'),
        validate
    ],
    exploreController.submitQuote
);

export default router;
