import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
import Client from '../models/Client';

const check = async () => {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const testClient = await Client.findOne({ name: 'Test Client' });
    console.log('Test Client:', testClient);
    process.exit(0);
};
check();
