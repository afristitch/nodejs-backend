import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
}

class CloudinaryService {
    /**
     * Uploads a Buffer to Cloudinary using stream-based upload (avoids disk I/O).
     * The Cloudinary Node SDK doesn't natively return Promises for stream uploads,
     * so we wrap upload_stream in a Promise for clean async/await usage.
     */
    async uploadImage(
        buffer: Buffer,
        folder = 'tailor/uploads',
        publicId?: string
    ): Promise<CloudinaryUploadResult> {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    public_id: publicId,
                    resource_type: 'image',
                },
                (error, result: UploadApiResponse | undefined) => {
                    if (error || !result) {
                        return reject(error ?? new Error('Cloudinary upload failed with no result.'));
                    }

                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        width: result.width,
                        height: result.height,
                        format: result.format,
                        bytes: result.bytes,
                    });
                }
            );

            stream.end(buffer);
        });
    }

    /**
     * Deletes an image from Cloudinary by its public_id.
     */
    async deleteImage(publicId: string): Promise<void> {
        await cloudinary.uploader.destroy(publicId);
    }
}

export const cloudinaryService = new CloudinaryService();
