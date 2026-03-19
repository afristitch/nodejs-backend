import { Response } from 'express';
import { AuthRequest, StyleGender } from '../types';
import styleService from '../services/style.service';
import { parsePagination } from '../utils/pagination';

/**
 * Handle creating a new style
 */
export const createStyle = async (req: AuthRequest, res: Response) => {
    try {
        const isGlobal = req.body.isGlobal === true || req.body.isGlobal === 'true';
        const isAdmin = req.user?.role === 'SUPER_ADMIN';

        if (isGlobal && !isAdmin) {
            return res.status(403).json({
                status: 'error',
                message: 'Only super admins can create global styles',
            });
        }

        const styleData = {
            ...req.body,
            organizationId: isGlobal ? null : req.organizationId,
            createdBy: req.user?._id,
        };

        const style = await styleService.createStyle(styleData);

        return res.status(201).json({
            status: 'success',
            data: { style },
        });
    } catch (error: any) {
        return res.status(400).json({
            status: 'error',
            message: error.message,
        });
    }
};

/**
 * Handle fetching styles for an organization
 */
export const getStyles = async (req: AuthRequest, res: Response) => {
    try {
        const organizationId = req.organizationId!;
        const options = parsePagination(req.query);

        const filters = {
            gender: req.query.gender as StyleGender,
            search: req.query.search as string,
        };

        const result = await styleService.getStyles(organizationId, options, filters);

        return res.status(200).json({
            status: 'success',
            ...result,
        });
    } catch (error: any) {
        return res.status(400).json({
            status: 'error',
            message: error.message,
        });
    }
};

/**
 * Handle fetching ONLY organization styles
 */
export const getMyStyles = async (req: AuthRequest, res: Response) => {
    try {
        const organizationId = req.organizationId!;
        const options = parsePagination(req.query);

        const filters = {
            gender: req.query.gender as StyleGender,
            search: req.query.search as string,
            onlyOrg: true,
        };

        const result = await styleService.getStyles(organizationId, options, filters);

        return res.status(200).json({
            status: 'success',
            ...result,
        });
    } catch (error: any) {
        return res.status(400).json({
            status: 'error',
            message: error.message,
        });
    }
};

/**
 * Handle fetching a single style
 */
export const getStyleById = async (req: AuthRequest, res: Response) => {
    try {
        const style = await styleService.getStyleById(req.params.id as string, req.organizationId!);

        if (!style) {
            return res.status(404).json({
                status: 'error',
                message: 'Style not found',
            });
        }

        return res.status(200).json({
            status: 'success',
            data: { style },
        });
    } catch (error: any) {
        return res.status(400).json({
            status: 'error',
            message: error.message,
        });
    }
};

/**
 * Handle updating a style
 */
export const updateStyle = async (req: AuthRequest, res: Response) => {
    try {
        const style = await styleService.updateStyle(req.params.id as string, req.organizationId!, req.body);

        if (!style) {
            return res.status(404).json({
                status: 'error',
                message: 'Style not found',
            });
        }

        return res.status(200).json({
            status: 'success',
            data: { style },
        });
    } catch (error: any) {
        return res.status(400).json({
            status: 'error',
            message: error.message,
        });
    }
};

/**
 * Handle deleting a style
 */
export const deleteStyle = async (req: AuthRequest, res: Response) => {
    try {
        const success = await styleService.deleteStyle(req.params.id as string, req.organizationId!);

        if (!success) {
            return res.status(404).json({
                status: 'error',
                message: 'Style not found',
            });
        }

        return res.status(204).send();
    } catch (error: any) {
        return res.status(400).json({
            status: 'error',
            message: error.message,
        });
    }
};

const styleController = {
    createStyle,
    getStyles,
    getMyStyles,
    getStyleById,
    updateStyle,
    deleteStyle,
};

export default styleController;
