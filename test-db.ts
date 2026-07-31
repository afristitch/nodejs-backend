import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import OrganizationMembership from './src/models/OrganizationMembership';
import User from './src/models/User';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI as string)
  .then(async () => {
    const user = await User.findOne({ email: 'google-play@tailor.com' });
    console.log("User:", user?.name);

    const memberships = await OrganizationMembership.find({ userId: user?._id });
    console.log("Memberships:", JSON.stringify(memberships, null, 2));
    process.exit(0);
  });
