import express from 'express';
import * as smsController from '../controllers/sms.controller';
import authenticate from '../middlewares/auth.middleware';
import subscriptionMiddleware from '../middlewares/subscription.middleware';

const router = express.Router();

/**
 * SMS Routes
 */

// All routes are protected and requires authentication and active subscription
router.use(authenticate);
router.use(subscriptionMiddleware);

// Notify individual order ready
router.post('/order-ready', smsController.notifyOrderReady);

// Send bulk marketing SMS
router.post('/marketing', smsController.sendBulkMarketing);

export default router;
