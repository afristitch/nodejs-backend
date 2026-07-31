import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
import Client from '../models/Client';
import User from '../models/User';
import OrganizationMembership from '../models/OrganizationMembership';

const check = async () => {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const email = 'google-play@tailor.com';
    const user = await User.findOne({ email });
    const membership = await OrganizationMembership.findOne({ userId: user?._id });
    const count = await Client.countDocuments({ organizationId: membership?.organizationId });
    console.log(`User org: ${membership?.organizationId}`);
    console.log(`Total clients for this org: ${count}`);
    const someClients = await Client.find({ organizationId: membership?.organizationId }).limit(2);
    console.log(someClients);
    process.exit(0);
};
check();
