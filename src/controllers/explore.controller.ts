import { Request, Response, NextFunction } from 'express';
import exploreService from '../services/explore.service';
import quoteService from '../services/quote.service';
import { successResponse, errorResponse } from '../utils/response';
import { parsePagination, paginatedResponse } from '../utils/pagination';

/**
 * Explore Controller
 * Public discovery and inquiry handlers
 */

/**
 * List public studios
 * GET /api/v1/explore
 */
export const listStudios = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pagination = parsePagination(req.query as any);
        const search = req.query.search as string || '';
        const specialty = req.query.specialty as string || '';
        const location = req.query.location as string || '';

        const { tailors, total } = await exploreService.getPublicTailors(
            pagination,
            search,
            specialty,
            location
        );

        const response = paginatedResponse(tailors, total, pagination.page, pagination.limit);
        return successResponse(res, response, 'Studios retrieved successfully');
    } catch (error) {
        return next(error);
    }
};

/**
 * Get studio details
 * GET /api/v1/explore/:id
 */
export const getStudio = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tailor = await exploreService.getPublicTailorById(req.params.id as string);
        return successResponse(res, tailor, 'Studio details retrieved successfully');
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return errorResponse(res, 'Studio not found', 404);
        }
        return next(error);
    }
};

/**
 * Submit quote request (Guest/User)
 * POST /api/v1/explore/quote
 */
export const submitQuote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { tailorId, guestInfo, details, customerId } = req.body;
        
        const quote = await quoteService.createQuoteRequest({
            tailorId,
            guestInfo,
            details,
            customerId,
        });

        return successResponse(res, quote, 'Quote request submitted successfully', 201);
    } catch (error) {
        return next(error);
    }
};

const exploreController = {
    listStudios,
    getStudio,
    submitQuote,
};

export default exploreController;
