import { PaginationQuery, PaginationOptions, PaginationMeta, PaginatedResponse } from '../types';

/**
 * Pagination Utility Functions
 */

/**
 * Parse pagination parameters from query
 */
export const parsePagination = (query: PaginationQuery): PaginationOptions => {
    const page = parseInt(query.page || '1') || 1;
    const limit = parseInt(query.limit || '10') || 10;
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
    };
};

/**
 * Format pagination metadata
 */
export const formatPaginationMeta = (
    total: number,
    page: number,
    limit: number
): PaginationMeta => {
    const totalPages = Math.ceil(total / limit);

    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};

/**
 * Create paginated response
 */
export const paginatedResponse = <T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): PaginatedResponse<T> => {
    return {
        data,
        pagination: formatPaginationMeta(total, page, limit),
    };
};
