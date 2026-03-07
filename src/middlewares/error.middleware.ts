import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Error Handling Middleware
 */
const errorMiddleware = (err: any, req: Request, res: Response, _next: NextFunction): void | Response => {
    // Log error with request details if available
    logger.error(`${err.message}`, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        userId: (req as any).user?._id,
    });

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((val: any) => val.message);
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: messages,
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            message: `Duplicate field value entered: ${field}`,
        });
    }

    // Mongoose CastError (invalid ID)
    if (err.name === 'CastError') {
        return res.status(404).json({
            success: false,
            message: `Resource not found. Invalid ${err.path}: ${err.value}`,
        });
    }

    // Default error
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    return res.status(statusCode).json({
        success: false,
        message:
            process.env.NODE_ENV === 'production' && statusCode === 500
                ? 'Internal Server Error'
                : message,
    });
};

export default errorMiddleware;
