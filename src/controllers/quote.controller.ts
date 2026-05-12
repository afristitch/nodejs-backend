import { Response, NextFunction } from 'express';
import quoteService from '../services/quote.service';
import { AuthRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import { parsePagination, paginatedResponse } from '../utils/pagination';

/**
 * Quote Controller
 * Studio management for inquiries
 */

/**
 * List studio inquiries
 * GET /api/v1/quotes
 */
export const listInquiries = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const orgId = req.organizationId as string;
        const pagination = parsePagination(req.query as any);
        const status = req.query.status as any;

        const { quotes, total } = await quoteService.getQuotesForOrganization(
            orgId,
            pagination,
            status
        );

        const response = paginatedResponse(quotes, total, pagination.page, pagination.limit);
        return successResponse(res, response, 'Inquiries retrieved successfully');
    } catch (error) {
        return next(error);
    }
};

/**
 * Respond to an inquiry
 * PATCH /api/v1/quotes/:id/respond
 */
export const respondInquiry = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const orgId = req.organizationId as string;
        const { id } = req.params;
        const { amount, items, notes } = req.body;

        const quote = await quoteService.respondToQuote(id as string, orgId, {
            amount,
            items,
            notes
        });

        return successResponse(res, quote, 'Quote sent successfully');
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return errorResponse(res, 'Quote request not found', 404);
        }
        return next(error);
    }
};

const quoteController = {
    listInquiries,
    respondInquiry,
};

export default quoteController;
