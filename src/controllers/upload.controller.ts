import { Response, NextFunction } from 'express';
import { uploadService } from '../services/upload.service';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../types';

/**
 * Upload Controller
 * Handles image upload requests
 */

/**
 * Upload a single image to Cloudinary
 * POST /api/v1/upload
 *
 * The frontend calls this endpoint first to get a Cloudinary URL,
 * then passes the URL when creating/updating orders or other resources.
 */
export const uploadImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            errorResponse(res, 'No image file provided', 400);
            return;
        }

        const userId = req.user?._id as string;
        const folder = (req.query.folder as string) || 'tailor/uploads';

        const result = await uploadService.uploadImage(req.file, userId, folder);

        successResponse(res, { url: result.url, publicId: result.publicId }, 'Image uploaded successfully', 201);
    } catch (error: any) {
        if (error.message?.includes('Invalid file type') || error.message?.includes('too large')) {
            errorResponse(res, error.message, 400);
            return;
        }
        next(error);
    }
};
