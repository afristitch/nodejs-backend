import express from 'express';
import * as revenuecatController from '../controllers/revenuecat.controller';

const router = express.Router();

/**
 * @route   POST /api/v1/revenuecat/webhook
 * @desc    Handle RevenueCat webhook events
 * @access  Public (secured via Authorization header)
 */
router.post('/webhook', revenuecatController.handleWebhook);

export default router;
