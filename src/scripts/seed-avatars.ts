import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import Avatar from '../models/Avatar';
import * as path from 'path';
import * as fs from 'fs';

// Load backend .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Seed Avatar Presets
 * Uploads bitmojis from frontend assets to Cloudinary and seeds the database
 */

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FRONTEND_AVATAR_DIR = path.join(__dirname, '../../../frontend/SewDigital/assets/images/avatars');
const AVATAR_FILES = Array.from({ length: 11 }, (_, i) => `avatar${i + 1}.png`);

const seedAvatars = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);

    console.log(`🚀 Starting avatar seeding for ${AVATAR_FILES.length} files...`);

    for (const fileName of AVATAR_FILES) {
      const filePath = path.join(FRONTEND_AVATAR_DIR, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ File not found, skipping: ${filePath}`);
        continue;
      }

      console.log(`📤 Uploading ${fileName} to Cloudinary...`);
      
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder: 'tailor/avatars',
        public_id: fileName.replace('.png', ''),
        overwrite: true,
      });

      console.log(`✅ Uploaded: ${uploadResult.secure_url}`);

      const avatarData = {
        name: `Tailor Avatar ${fileName.match(/\d+/)?.[0]}`,
        url: uploadResult.secure_url,
        isActive: true,
        category: 'tailor'
      };

      await Avatar.findOneAndUpdate(
        { name: avatarData.name },
        { $set: avatarData },
        { upsert: true, new: true }
      );
      
      console.log(`💾 Saved to DB: ${avatarData.name}`);
    }

    console.log('\n✨ Seeding complete! All 11 avatars are now in the database and Cloudinary.');
  } catch (error) {
    console.error('❌ Error seeding avatars:', error);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

seedAvatars();
