import express from 'express';
import * as smsController from '../controllers/sms.controller';
import authenticate from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * SMS Routes
 */

// All routes are protected and requires authentication
router.use(authenticate);

// Notify individual order ready
router.post('/order-ready', smsController.notifyOrderReady);

// Send bulk marketing SMS
router.post('/marketing', smsController.sendBulkMarketing);

export default router;
