import { imageService } from './image.service';
import { cloudinaryService, CloudinaryUploadResult } from './cloudinary.service';

export interface UploadResult extends CloudinaryUploadResult { }

class UploadService {
    /**
     * Orchestrates the full upload pipeline:
     *   Multer buffer
     *     → imageService.validateImage()   // type + size guard (defense-in-depth)
     *     → imageService.processImage()    // adaptive compress / resize
     *     → cloudinaryService.uploadImage() // stream buffer to Cloudinary
     *     → return { url, publicId, width, height, format, bytes }
     *
     * @param file     - The multer file object (memory storage)
     * @param userId   - Optional user ID for namespacing the public_id
     * @param folder   - Target Cloudinary folder (defaults to tailor/uploads)
     */
    async uploadImage(
        file: Express.Multer.File,
        userId?: string,
        folder = 'tailor/uploads'
    ): Promise<UploadResult> {
        // Step 1: Re-validate at the service layer (defense-in-depth)
        imageService.validateImage(file);

        // Step 2: Compress / resize the image buffer if needed
        const processedBuffer = await imageService.processImage(file.buffer);

        // Step 3: Build a namespaced public_id
        const timestamp = Date.now();
        const publicId = userId
            ? `${userId}_${timestamp}`
            : `upload_${timestamp}`;

        // Step 4: Upload the processed buffer to Cloudinary
        const result = await cloudinaryService.uploadImage(
            processedBuffer,
            folder,
            publicId
        );

        return result;
    }

    /**
     * Deletes an image from Cloudinary.
     */
    async deleteImage(publicId: string): Promise<void> {
        await cloudinaryService.deleteImage(publicId);
    }
}

export const uploadService = new UploadService();
