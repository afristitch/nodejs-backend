import { Response, NextFunction } from 'express';
import measurementService from '../services/measurement.service';
import { successResponse, errorResponse } from '../utils/response';
import { paginatedResponse, parsePagination } from '../utils/pagination';
import { AuthRequest } from '../types';

/**
 * Measurement Controller
 * Handles HTTP requests for measurement templates and records
 */

// ==================== TEMPLATES ====================

/**
 * Create a new measurement template
 * POST /api/v1/measurements/templates
 */
export const createTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const userId = req.user?._id as string;

        const template = await measurementService.createTemplate(
            organizationId,
            req.body,
            userId
        );

        successResponse(res, template, 'Template created successfully', 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all measurement templates
 * GET /api/v1/measurements/templates
 */
export const getTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const pagination = parsePagination(req.query as any);

        const { templates, total } = await measurementService.getTemplates(
            organizationId,
            pagination,
            req.query
        );

        const response = paginatedResponse(templates, total, pagination.page, pagination.limit);

        successResponse(res, response, 'Templates retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get template by ID
 * GET /api/v1/measurements/templates/:id
 */
export const getTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        const template = await measurementService.getTemplateById(
            id,
            organizationId
        );

        successResponse(res, template, 'Template retrieved successfully');
    } catch (error: any) {
        if (error.message === 'Template not found') {
            errorResponse(res, 'Template not found', 404);
            return;
        }
        next(error);
    }
};

/**
 * Update template
 * PUT /api/v1/measurements/templates/:id
 */
export const updateTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        const template = await measurementService.updateTemplate(
            id,
            organizationId,
            req.body
        );

        successResponse(res, template, 'Template updated successfully');
    } catch (error: any) {
        if (error.message === 'Template not found') {
            errorResponse(res, 'Template not found', 404);
            return;
        }
        next(error);
    }
};

/**
 * Delete template
 * DELETE /api/v1/measurements/templates/:id
 */
export const deleteTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        await measurementService.deleteTemplate(id, organizationId);

        successResponse(res, null, 'Template deleted successfully');
    } catch (error: any) {
        if (error.message === 'Template not found') {
            errorResponse(res, 'Template not found', 404);
            return;
        }
        next(error);
    }
};

// ==================== MEASUREMENTS ====================

/**
 * Create a measurement record
 * POST /api/v1/measurements
 */
export const createMeasurement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const userId = req.user?._id as string;

        const measurement = await measurementService.createMeasurement(
            organizationId,
            req.body,
            userId
        );

        successResponse(
            res,
            measurement,
            'Measurement created successfully',
            201
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get all measurements
 * GET /api/v1/measurements
 */
export const getMeasurements = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const pagination = parsePagination(req.query as any);

        const { measurements, total } = await measurementService.getMeasurements(
            organizationId,
            pagination
        );

        const response = paginatedResponse(measurements, total, pagination.page, pagination.limit);

        successResponse(res, response, 'Measurements retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get measurements by client ID
 * GET /api/v1/measurements/client/:clientId
 */
export const getMeasurementsByClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const clientId = req.params.clientId as string;
        const measurements = await measurementService.getMeasurementsByClient(
            clientId,
            organizationId
        );

        successResponse(res, measurements, 'Measurements retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get measurement by ID
 * GET /api/v1/measurements/:id
 */
export const getMeasurementById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        const measurement = await measurementService.getMeasurementById(
            id,
            organizationId
        );

        successResponse(res, measurement, 'Measurement retrieved successfully');
    } catch (error: any) {
        if (error.message === 'Measurement not found') {
            errorResponse(res, 'Measurement not found', 404);
            return;
        }
        next(error);
    }
};

/**
 * Update measurement
 * PUT /api/v1/measurements/:id
 */
export const updateMeasurement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        const measurement = await measurementService.updateMeasurement(
            id,
            organizationId,
            req.body
        );

        successResponse(res, measurement, 'Measurement updated successfully');
    } catch (error: any) {
        if (error.message === 'Measurement not found') {
            errorResponse(res, 'Measurement not found', 404);
            return;
        }
        next(error);
    }
};

/**
 * Delete measurement
 * DELETE /api/v1/measurements/:id
 */
export const deleteMeasurement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        await measurementService.deleteMeasurement(id, organizationId);

        successResponse(res, null, 'Measurement deleted successfully');
    } catch (error: any) {
        if (error.message === 'Measurement not found') {
            errorResponse(res, 'Measurement not found', 404);
            return;
        }
        next(error);
    }
};
