import { Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AuthRequest } from '../types';

/**
 * Logging Middleware
 * Logs structured information about every incoming request and its response
 */
export const loggingMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const start = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || 'unknown';

    // Finish event is fired when the response has been sent to the client
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        const userId = req.user?._id || 'unauthenticated';

        // Log the completed request
        logger.info(`${method} ${originalUrl} ${statusCode} ${duration}ms`, {
            method,
            url: originalUrl,
            status: statusCode,
            duration: `${duration}ms`,
            ip,
            userAgent,
            userId,
        });
    });

    next();
};
