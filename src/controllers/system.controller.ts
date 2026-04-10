import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import logger from '../utils/logger';
import systemService from '../services/system.service';

/**
 * System Controller
 * Handles administrative tasks like log management
 */

const logDir = path.join(process.cwd(), 'logs');

/**
 * List all log files
 * GET /api/v1/system/logs
 */
export const getLogFiles = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        logger.info('User listing log files', { userId: req.user?._id });
        if (!fs.existsSync(logDir)) {
            return successResponse(res, [], 'No logs found');
        }

        const files = fs.readdirSync(logDir)
            .filter(file => file.endsWith('.log'))
            .map(file => {
                const stats = fs.statSync(path.join(logDir, file));
                return {
                    name: file,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    updatedAt: stats.mtime,
                };
            })
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

        return successResponse(res, files, 'Log files retrieved successfully');
    } catch (error) {
        logger.error('Error listing log files', { error });
        return next(error);
    }
};

/**
 * Get a specific log file content
 * GET /api/v1/system/logs/:filename
 */
export const getLogFileContent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const filename = req.params.filename as string;

        // Security check: prevent directory traversal
        if (!filename || filename.includes('..') || !filename.endsWith('.log')) {
            return errorResponse(res, 'Invalid log file requested', 400);
        }

        const filePath = path.join(logDir, filename);

        if (!fs.existsSync(filePath)) {
            return errorResponse(res, 'Log file not found', 404);
        }

        // Stream the file back
        const stream = fs.createReadStream(filePath);
        res.setHeader('Content-Type', 'text/plain');
        stream.pipe(res);
    } catch (error) {
        logger.error('Error reading log file', { error });
        return next(error);
    }
};

/**
 * Get platform monitoring settings
 * GET /api/v1/system/health/settings
 */
export const getHealthSettings = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const settings = await systemService.getSettings();
        return successResponse(res, settings, 'System settings retrieved successfully');
    } catch (error) {
        logger.error('Error fetching system settings', { error });
        return next(error);
    }
};

/**
 * Update platform monitoring settings
 * PATCH /api/v1/system/health/settings
 */
export const updateHealthSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { monitoringEnabled, checkInterval } = req.body;
        
        const updateData: any = {};
        if (typeof monitoringEnabled === 'boolean') updateData.monitoringEnabled = monitoringEnabled;
        if (typeof checkInterval === 'number') updateData.checkInterval = checkInterval;

        const settings = await systemService.updateSettings(updateData);
        
        logger.info('System settings updated', { 
            userId: req.user?._id, 
            monitoringEnabled: settings.monitoringEnabled,
            checkInterval: settings.checkInterval
        });

        return successResponse(res, settings, 'System settings updated successfully');
    } catch (error) {
        logger.error('Error updating system settings', { error });
        return next(error);
    }
};
