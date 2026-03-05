import express from 'express';
import * as paymentController from '../controllers/payment.controller';
import protect from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @route   POST /api/v1/payments/initialize
 * @desc    Initialize subscription payment
 * @access  Private
 */
router.post('/initialize', protect, paymentController.initializeSubscription);

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Handle Paystack Webhook
 * @access  Public
 */
router.post('/webhook', paymentController.handleWebhook);

export default router;
