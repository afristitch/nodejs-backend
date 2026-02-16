import { Response } from 'express';

/**
 * Consistent API Response Utilities
 */

/**
 * Send success response
 */
export const successResponse = (
    res: Response,
    data: any = null,
    message: string = 'Success',
    statusCode: number = 200
): Response => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

/**
 * Send error response
 */
export const errorResponse = (
    res: Response,
    message: string = 'Internal Server Error',
    statusCode: number = 500,
    errors: string[] | null = null
): Response => {
    const response: any = {
        success: false,
        message,
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};
