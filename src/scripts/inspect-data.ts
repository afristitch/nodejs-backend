import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import Organization from '../models/Organization';
import connectDB from '../config/database';

const inspect = async () => {
    try {
        await connectDB();
        console.log('Connected to database.');

        const user = await User.findOne().lean();
        const org = await Organization.findOne().lean();

        console.log('--- SAMPLE USER ---');
        console.log(JSON.stringify(user, null, 2));
        
        console.log('\n--- SAMPLE ORGANIZATION ---');
        console.log(JSON.stringify(org, null, 2));

    } catch (error: any) {
        console.error('❌ Inspection failed:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

inspect();
