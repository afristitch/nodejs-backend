import express from 'express';
import * as planController from '../controllers/plan.controller';
import authenticate from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * Plan Routes
 */

// All routes are protected
router.use(authenticate);

router.get('/', planController.getPlans);
router.get('/discounts', planController.getDiscountTiers);
router.post('/calculate-price', planController.calculatePrice);

export default router;
