import { PaginationQuery, PaginationOptions, PaginationMeta, PaginatedResponse } from '../types';

/**
 * Pagination Utility Functions
 */

/**
 * Parse pagination parameters from query
 */
export const parsePagination = (query: PaginationQuery): PaginationOptions => {
    if (!query.page && !query.limit) {
        return {
            page: 1,
            limit: 0,
            skip: 0,
        };
    }

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
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: limit > 0 ? page < totalPages : false,
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
