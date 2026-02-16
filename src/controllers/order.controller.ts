import { Response, NextFunction } from 'express';
import orderService from '../services/order.service';
import { successResponse, errorResponse } from '../utils/response';
import { paginatedResponse, parsePagination } from '../utils/pagination';
import { AuthRequest } from '../types';

/**
 * Order Controller
 * Handles HTTP requests for order management
 */

/**
 * Create a new order
 * POST /api/v1/orders
 */
export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const userId = req.user?._id as string;

        const order = await orderService.createOrder(
            organizationId,
            req.body,
            userId
        );

        successResponse(res, order, 'Order created successfully', 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Get all orders
 * GET /api/v1/orders
 */
export const getOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const pagination = parsePagination(req.query as any);

        const { orders, total } = await orderService.getOrders(
            organizationId,
            pagination,
            req.query
        );

        const response = paginatedResponse(orders, total, pagination.page, pagination.limit);

        successResponse(res, response, 'Orders retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get order by ID
 * GET /api/v1/orders/:id
 */
export const getOrderById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        const order = await orderService.getOrderById(
            id,
            organizationId
        );

        successResponse(res, order, 'Order retrieved successfully');
    } catch (error: any) {
        if (error.message === 'Order not found') {
            errorResponse(res, 'Order not found', 404);
            return;
        }
        next(error);
    }
};

/**
 * Update order
 * PUT /api/v1/orders/:id
 */
export const updateOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        const order = await orderService.updateOrder(
            id,
            organizationId,
            req.body
        );

        successResponse(res, order, 'Order updated successfully');
    } catch (error: any) {
        if (error.message === 'Order not found') {
            errorResponse(res, 'Order not found', 404);
            return;
        }
        next(error);
    }
};

/**
 * Update order status
 * PATCH /api/v1/orders/:id/status
 */
export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        const { status } = req.body;

        const order = await orderService.updateOrderStatus(
            id,
            organizationId,
            status
        );

        successResponse(res, order, 'Order status updated successfully');
    } catch (error: any) {
        if (error.message === 'Order not found') {
            errorResponse(res, 'Order not found', 404);
            return;
        }
        next(error);
    }
};

/**
 * Record payment
 * PATCH /api/v1/orders/:id/payment
 */
export const recordPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        const { amount } = req.body;

        const order = await orderService.recordPayment(
            id,
            organizationId,
            amount
        );

        successResponse(res, order, 'Payment recorded successfully');
    } catch (error: any) {
        if (error.message === 'Order not found') {
            errorResponse(res, 'Order not found', 404);
            return;
        }
        if (error.message.includes('exceeds')) {
            errorResponse(res, error.message, 400);
            return;
        }
        next(error);
    }
};

/**
 * Delete order
 * DELETE /api/v1/orders/:id
 */
export const deleteOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const id = req.params.id as string;
        await orderService.deleteOrder(id, organizationId);

        successResponse(res, null, 'Order deleted successfully');
    } catch (error: any) {
        if (error.message === 'Order not found') {
            errorResponse(res, 'Order not found', 404);
            return;
        }
        next(error);
    }
};

/**
 * Get financial summary (ADMIN only)
 * GET /api/v1/orders/reports/financial
 */
export const getFinancialSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.organizationId as string;
        const summary = await orderService.getFinancialSummary(
            organizationId,
            req.query
        );

        successResponse(res, summary, 'Financial summary retrieved successfully');
    } catch (error) {
        next(error);
    }
};
