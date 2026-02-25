import { Request, Response, NextFunction } from 'express';
import planService from '../services/plan.service';
import { successResponse } from '../utils/response';

/**
 * Plan Controller
 * Handles HTTP requests for retrieving subscription plans
 */

/**
 * Get all active plans
 * GET /api/v1/plans
 */
export const getPlans = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const plans = await planService.getActivePlans();
        return successResponse(res, plans, 'Plans retrieved successfully');
    } catch (error: any) {
        return next(error);
    }
};

const planController = {
    getPlans,
};

export default planController;
