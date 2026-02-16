import { Response, NextFunction } from 'express';
import clientService from '../services/client.service';
import { successResponse, errorResponse } from '../utils/response';
import { paginatedResponse, parsePagination } from '../utils/pagination';
import { AuthRequest } from '../types';

/**
 * Client Controller
 * Handles HTTP requests for client management
 */

/**
 * Create a new client
 * POST /api/v1/clients
 */
export const createClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const userId = req.user?._id as string;

        const client = await clientService.createClient(
            organizationId,
            req.body,
            userId
        );

        successResponse(res, client, 'Client created successfully', 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all clients
 * GET /api/v1/clients
 */
export const getClients = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const pagination = parsePagination(req.query as any);
        const search = req.query.search as string || '';

        const { clients, total } = await clientService.getClients(
            organizationId,
            pagination,
            search
        );

        const response = paginatedResponse(clients, total, pagination.page, pagination.limit);

        successResponse(res, response, 'Clients retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get client by ID
 * GET /api/v1/clients/:id
 */
export const getClientById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        const client = await clientService.getClientById(
            id,
            organizationId
        );

        successResponse(res, client, 'Client retrieved successfully');
    } catch (error: any) {
        if (error.message === 'Client not found') {
            errorResponse(res, 'Client not found', 404);
            return;
        }
        next(error);
    }
};

/**
 * Update client
 * PUT /api/v1/clients/:id
 */
export const updateClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        const client = await clientService.updateClient(
            id,
            organizationId,
            req.body
        );

        successResponse(res, client, 'Client updated successfully');
    } catch (error: any) {
        if (error.message === 'Client not found') {
            errorResponse(res, 'Client not found', 404);
            return;
        }
        next(error);
    }
};

/**
 * Delete client (soft delete)
 * DELETE /api/v1/clients/:id
 */
export const deleteClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        await clientService.deleteClient(id, organizationId);

        successResponse(res, null, 'Client deleted successfully');
    } catch (error: any) {
        if (error.message === 'Client not found') {
            errorResponse(res, 'Client not found', 404);
            return;
        }
        next(error);
    }
};
