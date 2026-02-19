import sharp from 'sharp';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;   // 5MB — hard cap
const TARGET_SIZE_BYTES = 1 * 1024 * 1024; // 1MB — compression target
const MAX_DIMENSION = 1200;                  // px — resize fallback bounding box

export interface ValidatedFile {
    buffer: Buffer;
    mimetype: string;
    size: number;
}

class ImageService {
    /**
     * Validates the file type and size at the service layer (defense-in-depth).
     * Throws if validation fails.
     */
    validateImage(file: Express.Multer.File): void {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new Error(
                `Invalid file type "${file.mimetype}". Allowed: JPEG, PNG, WebP.`
            );
        }

        if (file.size > MAX_SIZE_BYTES) {
            throw new Error(
                `File is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum allowed size is 5 MB.`
            );
        }
    }

    /**
     * Two-stage adaptive compressor:
     *   1. Files < 1 MB are returned as-is.
     *   2. Quality loop  — re-encode from quality 80 → 20 (step -10) until < 1 MB.
     *   3. Resize fallback — if still ≥ 1 MB, hard-resize to 1200×1200 @ quality 70.
     */
    async processImage(buffer: Buffer): Promise<Buffer> {
        // Stage 1: Skip small files
        if (buffer.length < TARGET_SIZE_BYTES) {
            return buffer;
        }

        // Stage 2: Quality loop
        for (let quality = 80; quality >= 20; quality -= 10) {
            const compressed = await sharp(buffer)
                .jpeg({ quality })
                .toBuffer();

            if (compressed.length < TARGET_SIZE_BYTES) {
                return compressed;
            }
        }

        // Stage 3: Resize fallback
        const resized = await sharp(buffer)
            .resize(MAX_DIMENSION, MAX_DIMENSION, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .jpeg({ quality: 70 })
            .toBuffer();

        return resized;
    }
}

export const imageService = new ImageService();
