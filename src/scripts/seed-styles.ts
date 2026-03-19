import mongoose from 'mongoose';
import 'dotenv/config';
import Style from '../models/Style';
import { StyleGender } from '../types';

/**
 * Seed Global Styles
 * Adds standard designs available to all organizations
 */

const globalStyles = [
    // MALE STYLES
    {
        name: 'Slim Fit Two-Piece Suit',
        description: 'A modern, tailored two-piece suit perfect for weddings and formal events. Features a notched lapel and double vents.',
        imageUrl: 'https://images.unsplash.com/photo-1594932224828-b4b05a832fe3?auto=format&fit=crop&q=80&w=800',
        gender: StyleGender.MALE,
        tags: ['formal', 'wedding', 'suit', 'modern'],
        organizationId: null,
        createdBy: 'system',
    },
    {
        name: 'Traditional Agbada',
        description: 'Rich three-piece traditional African attire. Includes the large outer robe, long-sleeved shirt, and trousers.',
        imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800',
        gender: StyleGender.MALE,
        tags: ['traditional', 'cultural', 'luxury'],
        organizationId: null,
        createdBy: 'system',
    },
    {
        name: 'Embroidered Kaftan',
        description: 'Elegant long-sleeved kaftan with intricate breast-plate embroidery. Comfortable yet sophisticated for semi-formal outings.',
        imageUrl: 'https://images.unsplash.com/photo-1619785294559-69346d0a850e?auto=format&fit=crop&q=80&w=800',
        gender: StyleGender.MALE,
        tags: ['semi-formal', 'cultural', 'kaftan'],
        organizationId: null,
        createdBy: 'system',
    },

    // FEMALE STYLES
    {
        name: 'A-Line Evening Gown',
        description: 'A classic A-line silhouette dress with a floor-length skirt. Features a sweetheart neckline and delicate lace detailing.',
        imageUrl: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=800',
        gender: StyleGender.FEMALE,
        tags: ['formal', 'evening', 'gown', 'lace'],
        organizationId: null,
        createdBy: 'system',
    },
    {
        name: 'Kente Wrap Dress',
        description: 'Stunning wrap dress made from authentic hand-woven Kente cloth. Vibrant colors and tribal patterns.',
        imageUrl: 'https://images.unsplash.com/photo-1621184455862-c163cdb33e00?auto=format&fit=crop&q=80&w=800',
        gender: StyleGender.FEMALE,
        tags: ['traditional', 'kente', 'colorful'],
        organizationId: null,
        createdBy: 'system',
    },
    {
        name: 'Peplum Top & Pencil Skirt',
        description: 'Chic corporate ensemble. The structured peplum top emphasizes the waist, paired with a matching knee-length skirt.',
        imageUrl: 'https://images.unsplash.com/photo-1539008835064-0e399583bf45?auto=format&fit=crop&q=80&w=800',
        gender: StyleGender.FEMALE,
        tags: ['corporate', 'chic', 'set'],
        organizationId: null,
        createdBy: 'system',
    },

    // UNISEX STYLES
    {
        name: 'Linen Summer Shirt',
        description: 'Breathable, oversized linen shirt with a mandarin collar. Perfect for tropical climates and casual beach days.',
        imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800',
        gender: StyleGender.UNISEX,
        tags: ['casual', 'summer', 'linen'],
        organizationId: null,
        createdBy: 'system',
    },
    {
        name: 'Streetwear Utility Vest',
        description: 'Modern techwear utility vest with multiple pockets and adjustable straps. Adds a functional edge to any outfit.',
        imageUrl: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800',
        gender: StyleGender.UNISEX,
        tags: ['streetwear', 'techwear', 'utility'],
        organizationId: null,
        createdBy: 'system',
    },
];

const seedStyles = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);

        console.log('Clearing existing global styles (optional, currently appending)...');
        // If you want to clear first: await Style.deleteMany({ organizationId: null });

        console.log(`Seeding ${globalStyles.length} styles...`);
        for (const style of globalStyles) {
            await Style.findOneAndUpdate(
                { name: style.name, organizationId: null },
                { $set: style },
                { upsert: true, new: true }
            );
            console.log(`  Added/Updated: ${style.name}`);
        }

        console.log('Seeding complete!');
    } catch (error) {
        console.error('Error seeding styles:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

seedStyles();
