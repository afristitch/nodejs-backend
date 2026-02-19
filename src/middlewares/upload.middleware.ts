import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
): void => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                `Invalid file type. Only JPEG, PNG, and WebP images are allowed.`
            )
        );
    }
};

export const uploadMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
    },
});

/**
 * Single-file upload field named "image".
 * Use this in your routes: router.post('/upload', uploadMiddleware.single('image'), controller)
 */
export const uploadSingle = uploadMiddleware.single('image');

/**
 * Multi-file upload (up to 10 images).
 */
export const uploadMultiple = uploadMiddleware.array('images', 10);
