import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
import Client from '../models/Client';
import User from '../models/User';

const check = async () => {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const email = 'google-play@tailor.com';
    const user = await User.findOne({ email });
    const count = await Client.countDocuments({ organizationId: user?.organizationId });
    console.log(`User org: ${user?.organizationId}`);
    console.log(`Total clients for this org: ${count}`);
    const someClients = await Client.find({ organizationId: user?.organizationId }).limit(2);
    console.log(someClients);
    process.exit(0);
};
check();
