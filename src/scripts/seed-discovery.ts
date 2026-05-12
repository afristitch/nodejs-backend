import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Organization from '../models/Organization';
import User from '../models/User';
import { UserRole } from '../types';

// Load environment variables from the backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || '';

const STUDIOS = [
  {
    name: 'Aries Fashion House',
    email: 'aries@demo.sewdigital.com',
    phone: '+233241111111',
    address: 'Osu, Accra (Behind Danquah Circle)',
    isPublic: true,
    logoUrl: 'https://images.unsplash.com/photo-1466027397211-20d0f2449a3f?q=80&w=1000&auto=format&fit=crop',
    bio: 'Premium bespoke tailoring for modern individuals. We specialize in contemporary designs with a touch of traditional elegance. Our team has over 15 years of combined experience in high-fashion garment construction.',
    specialties: ['Bespoke Suits', 'Wedding Gowns', 'Corporate Wear'],
    portfolioUrls: [
      'https://plus.unsplash.com/premium_photo-1675186049409-f9f8f60ebb5e?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1776880471112-708c211e6a4b?q=80&w=1000&auto=format&fit=crop'
    ],
    rating: 4.9,
    reviewCount: 124,
  },
  {
    name: 'Stitch by Sam',
    email: 'sam@demo.sewdigital.com',
    phone: '+233242222222',
    address: 'East Legon, Accra (Near ANC Mall)',
    isPublic: true,
    logoUrl: 'https://images.unsplash.com/photo-1630930678172-63343537a00a?w=600&auto=format&fit=crop',
    bio: 'Mastering the art of traditional African wear with a modern twist. From Kente bridal wear to casual Ankara prints, we bring your vision to life with precision and speed.',
    specialties: ['Traditional African Wear', 'Ankara Styles', 'Casual Prints'],
    portfolioUrls: [
      'https://images.unsplash.com/photo-1731595758668-3d2fabfe1fdb?q=80&w=764&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1731595759028-861a56a79b59?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1757140447779-9cffcc270104?w=600&auto=format&fit=crop'
    ],
    rating: 4.7,
    reviewCount: 89,
  },
  {
    name: 'The Modern Seamstress',
    email: 'modern@demo.sewdigital.com',
    phone: '+233243333333',
    address: 'Kumasi, Ashanti (Asokwa Commercial Area)',
    isPublic: true,
    logoUrl: 'https://images.unsplash.com/photo-1558227108-83a15ddbbb15?q=80&w=800&auto=format&fit=crop',
    bio: 'Expert alterations and custom garment design. Whether it is a high-stakes corporate interview or a casual evening out, we ensure you look your absolute best with perfect-fit clothing.',
    specialties: ['Alterations', 'Ready-to-wear', 'Children Wear'],
    portfolioUrls: [
      'https://images.unsplash.com/photo-1558227108-83a15ddbbb15?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop'
    ],
    rating: 4.8,
    reviewCount: 56,
  }
];

async function seed() {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    for (const studioData of STUDIOS) {
      console.log(`Seeding ${studioData.name}...`);
      
      const existingOrg = await Organization.findOne({ email: studioData.email });
      
      let org;
      if (existingOrg) {
        console.log(`- Studio already exists, updating...`);
        existingOrg.set(studioData);
        org = await existingOrg.save();
      } else {
        const orgId = uuidv4();
        org = new Organization({
          ...studioData,
          _id: orgId,
          createdBy: 'system-seeder',
          subscriptionPlan: 'premium',
          subscriptionStatus: 'active'
        });
        await org.save();
      }
      
      // Upsert Staff User
      const existingUser = await User.findOne({ email: studioData.email });
      if (!existingUser) {
        const userId = uuidv4();
        const user = new User({
          _id: userId,
          name: `${studioData.name} Admin`,
          email: studioData.email,
          password: 'Password123!',
          role: UserRole.ORG_ADMIN,
          organizationId: org._id,
          isEmailVerified: true
        });
        await user.save();
        console.log(`- Created staff user: ${studioData.email}`);
      } else {
        console.log(`- Staff user already exists: ${studioData.email}`);
      }
    }

    console.log('\nSeeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
