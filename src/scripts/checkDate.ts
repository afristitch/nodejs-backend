import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from '../models/Organization';
import User from '../models/User';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        const user = await User.findOne({ email: 'cojjojimmy12@gmail.com' });
        if (user) {
            const org = await Organization.findById(user.organizationId);
            console.log(org?.subscriptionEndsAt);
        } else {
            console.log('User not found');
        }
    } finally {
        await mongoose.disconnect();
    }
};
check();
