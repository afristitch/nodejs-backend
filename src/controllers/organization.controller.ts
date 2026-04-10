import { Response, NextFunction } from 'express';

import organizationService from '../services/organization.service';
import subscriptionService from '../services/subscription.service';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../types';
import { paginatedResponse, parsePagination } from '../utils/pagination';

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

/**
 * Get all organizations (SUPER_ADMIN only)
 * GET /api/v1/organization/all
 */
export const getAllOrganizations = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const pagination = parsePagination(req.query as any);
        const search = req.query.search as string || '';
        const status = req.query.status as string || '';
        const isPaginated = !!(req.query.page || req.query.limit);

        const { organizations, total } = await organizationService.getOrganizations(
            pagination,
            search,
            status,
            isPaginated
        );

        const response = paginatedResponse(organizations, total, pagination.page, pagination.limit);

        return successResponse(res, response, 'Organizations retrieved successfully');
    } catch (error) {
        return next(error);
    }
};

/**
 * Get organization by ID (SUPER_ADMIN only)
 * GET /api/v1/organization/:id
 */
export const getAdminOrganizationById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        
        // Basic existence check
        if (!id) {
            return errorResponse(res, 'Organization ID is required', 400);
        }

        const organization = await organizationService.getOrganizationById(id);

        return successResponse(res, organization, 'Organization retrieved successfully');
    } catch (error: any) {
        if (error.message === 'Organization not found') {
            return errorResponse(res, 'Organization not found', 404);
        }
        return next(error);
    }
};

/**
 * Update organization by ID (SUPER_ADMIN only)
 * PUT /api/v1/organization/:id
 */
export const adminUpdateOrganization = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const organization = await organizationService.updateOrganization(
            id,
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
 * Delete organization (SUPER_ADMIN only)
 * DELETE /api/v1/organization/:id
 */
export const deleteAdminOrganization = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        await organizationService.deleteOrganization(id);

        return successResponse(res, null, 'Organization deleted successfully');
    } catch (error: any) {
        if (error.message === 'Organization not found') {
            return errorResponse(res, 'Organization not found', 404);
        }
        return next(error);
    }
};

export const organizationController = {
    getOrganization,
    updateOrganization,
    getSubscriptionStatus,
    getAllOrganizations,
    getAdminOrganizationById,
    adminUpdateOrganization,
    deleteAdminOrganization
};
