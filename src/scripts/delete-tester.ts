import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import Organization from '../models/Organization';
import connectDB from '../config/database';

const deleteTester = async () => {
    const email = process.argv[2];
    if (!email) {
        console.error('❌ Email is required');
        process.exit(1);
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) {
        console.log(`❌ User ${email} not found`);
    } else {
        await Organization.deleteOne({ _id: user.organizationId });
        await User.deleteOne({ email });
        console.log(`✅ Deleted user and org for ${email}`);
    }
    await mongoose.connection.close();
    process.exit(0);
};

deleteTester();
