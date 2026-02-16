import { Response, NextFunction } from 'express';
import userService from '../services/user.service';
import { successResponse, errorResponse } from '../utils/response';
import { paginatedResponse, parsePagination } from '../utils/pagination';
import { AuthRequest } from '../types';

/**
 * User Controller
 * Handles HTTP requests for user management
 */

/**
 * Create a new user (ADMIN only)
 * POST /api/v1/users
 */
export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const user = await userService.createUser(organizationId, req.body);

        successResponse(res, user, 'User created successfully', 201);
    } catch (error: any) {
        if (error.message === 'Email already registered') {
            errorResponse(res, error.message, 400);
            return;
        }
        next(error);
    }
};

/**
 * Get all users
 * GET /api/v1/users
 */
export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const pagination = parsePagination(req.query as any);
        const search = req.query.search as string || '';

        const { users, total } = await userService.getUsers(
            organizationId,
            pagination,
            search
        );

        const response = paginatedResponse(users, total, pagination.page, pagination.limit);

        successResponse(res, response, 'Users retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get user by ID
 * GET /api/v1/users/:id
 */
export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        const user = await userService.getUserById(id, organizationId);

        successResponse(res, user, 'User retrieved successfully');
    } catch (error: any) {
        if (error.message === 'User not found') {
            errorResponse(res, 'User not found', 404);
            return;
        }
        next(error);
    }
};

/**
 * Update user (ADMIN only)
 * PUT /api/v1/users/:id
 */
export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        const user = await userService.updateUser(
            id,
            organizationId,
            req.body
        );

        successResponse(res, user, 'User updated successfully');
    } catch (error: any) {
        if (error.message === 'User not found') {
            errorResponse(res, 'User not found', 404);
            return;
        }
        next(error);
    }
};

/**
 * Delete user (ADMIN only)
 * DELETE /api/v1/users/:id
 */
export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        await userService.deleteUser(id, organizationId);

        successResponse(res, null, 'User deleted successfully');
    } catch (error: any) {
        if (error.message === 'User not found') {
            errorResponse(res, 'User not found', 404);
            return;
        }
        next(error);
    }
};
