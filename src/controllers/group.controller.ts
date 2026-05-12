import { Response, NextFunction } from 'express';
import groupService from '../services/group.service';
import { successResponse, errorResponse } from '../utils/response';
import { paginatedResponse, parsePagination } from '../utils/pagination';
import { AuthRequest } from '../types';

/**
 * Group Controller
 * Handles HTTP requests for group management
 */

/**
 * Create a new group
 * POST /api/v1/groups
 */
export const createGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const userId = req.user?._id as string;

        const group = await groupService.createGroup(organizationId, req.body, userId);
        successResponse(res, group, 'Group created successfully', 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all groups
 * GET /api/v1/groups
 */
export const getGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const pagination = parsePagination(req.query as any);
        const search = req.query.search as string || '';

        const { groups, total } = await groupService.getGroups(organizationId, pagination, search);
        const response = paginatedResponse(groups, total, pagination.page, pagination.limit);

        successResponse(res, response, 'Groups retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get group by ID
 * GET /api/v1/groups/:id
 */
export const getGroupById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const group = await groupService.getGroupById(req.params.id as string, organizationId);
        successResponse(res, group, 'Group retrieved successfully');
    } catch (error: any) {
        if (error.message === 'Group not found') {
            errorResponse(res, 'Group not found', 404);
            return;
        }
        next(error);
    }
};

/**
 * Update group
 * PUT /api/v1/groups/:id
 */
export const updateGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const group = await groupService.updateGroup(req.params.id as string, organizationId, req.body);
        successResponse(res, group, 'Group updated successfully');
    } catch (error: any) {
        if (error.message === 'Group not found') {
            errorResponse(res, 'Group not found', 404);
            return;
        }
        next(error);
    }
};

/**
 * Delete group
 * DELETE /api/v1/groups/:id
 */
export const deleteGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        await groupService.deleteGroup(req.params.id as string, organizationId);
        successResponse(res, null, 'Group deleted successfully');
    } catch (error: any) {
        if (error.message === 'Group not found') {
            errorResponse(res, 'Group not found', 404);
            return;
        }
        next(error);
    }
};

// ─── Members ────────────────────────────────────────────────────────────────

/**
 * Get group members
 * GET /api/v1/groups/:id/members
 */
export const getMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const members = await groupService.getMembers(req.params.id as string, organizationId);
        successResponse(res, members, 'Members retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Add member to group
 * POST /api/v1/groups/:id/members
 */
export const addMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const member = await groupService.addMember(req.params.id as string, req.body.clientId, organizationId);
        successResponse(res, member, 'Member added successfully', 201);
    } catch (error: any) {
        if (error.message === 'Client is already a member of this group') {
            errorResponse(res, error.message, 409);
            return;
        }
        if (error.message === 'Group not found' || error.message === 'Client not found') {
            errorResponse(res, error.message, 404);
            return;
        }
        next(error);
    }
};

/**
 * Remove member from group
 * DELETE /api/v1/groups/:id/members/:memberId
 */
export const removeMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await groupService.removeMember(req.params.id as string, req.params.memberId as string);
        successResponse(res, null, 'Member removed successfully');
    } catch (error: any) {
        if (error.message === 'Member not found') {
            errorResponse(res, 'Member not found', 404);
            return;
        }
        next(error);
    }
};
