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

export default router;
