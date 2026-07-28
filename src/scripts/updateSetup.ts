import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from '../models/Organization';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const updateSetup = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        const result = await Organization.updateMany(
            {},
            { $set: { isSetupComplete: true } }
        );

        console.log(`Successfully updated ${result.modifiedCount} organizations.`);
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

updateSetup();
