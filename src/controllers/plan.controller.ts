import { Request, Response, NextFunction } from 'express';
import planService from '../services/plan.service';
import { calculateSubscriptionPrice } from '../services/subscription.service';
import { successResponse, errorResponse } from '../utils/response';

/**
 * Plan Controller
 * Handles HTTP requests for retrieving subscription plans and pricing
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

/**
 * Get available discount tiers
 * GET /api/v1/plans/discounts
 */
export const getDiscountTiers = async (_req: Request, res: Response) => {
    const tiers = [
        { minMonths: 1, discount: 0, label: 'Monthly' },
        { minMonths: 2, discount: 0.05, label: '2-3 Months' },
        { minMonths: 4, discount: 0.10, label: '4-6 Months' },
        { minMonths: 7, discount: 0.15, label: '7-11 Months' },
        { minMonths: 12, discount: 0.20, label: 'Annual (12+ Months)' },
    ];
    return successResponse(res, tiers, 'Discount tiers retrieved successfully');
};

/**
 * Calculate price for a plan and duration
 * POST /api/v1/plans/calculate-price
 */
export const calculatePrice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { planId, months = 1 } = req.body;

        if (!planId) {
            return errorResponse(res, 'Plan ID is required', 400);
        }

        const plan = await planService.getPlanById(planId);
        if (!plan) {
            return errorResponse(res, 'Plan not found', 404);
        }

        const baseTotal = plan.price * months;
        const discountedTotal = calculateSubscriptionPrice(plan.price, months);
        const savings = Number((baseTotal - discountedTotal).toFixed(2));
        const discountPercentage = Math.round(((baseTotal - discountedTotal) / baseTotal) * 100) || 0;

        const breakdown = {
            planName: plan.name,
            basePrice: plan.price,
            months,
            baseTotal,
            discountedTotal,
            savings,
            discountPercentage,
            currency: plan.currency,
        };

        return successResponse(res, breakdown, 'Price calculated successfully');
    } catch (error: any) {
        return next(error);
    }
};

const planController = {
    getPlans,
    getDiscountTiers,
    calculatePrice,
};

export default planController;
