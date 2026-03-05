import { Response, NextFunction } from 'express';

import organizationService from '../services/organization.service';
import subscriptionService from '../services/subscription.service';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../types';

/**
 * Organization Controller
 * Handles HTTP requests for organization management
 */

/**
 * Get organization details
 * GET /api/v1/organization
 */
export const getOrganization = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const organization = await organizationService.getOrganizationById(organizationId);

        return successResponse(res, organization, 'Organization retrieved successfully');
    } catch (error: any) {
        if (error.message === 'Organization not found') {
            return errorResponse(res, 'Organization not found', 404);
        }
        return next(error);
    }
};

/**
 * Update organization (ADMIN only)
 * PUT /api/v1/organization
 */
export const updateOrganization = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const organization = await organizationService.updateOrganization(
            organizationId,
            req.body
        );

        return successResponse(res, organization, 'Organization updated successfully');
    } catch (error: any) {
        if (error.message === 'Organization not found') {
            return errorResponse(res, 'Organization not found', 404);
        }
        return next(error);
    }
};

/**
 * Get organization subscription status
 * GET /api/v1/organization/subscription
 */
export const getSubscriptionStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const subscriptionInfo = await subscriptionService.getSubscriptionStatus(organizationId);

        return successResponse(res, subscriptionInfo, 'Subscription status retrieved successfully');
    } catch (error: any) {
        return next(error);
    }
};
