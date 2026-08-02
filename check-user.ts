import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import OrganizationMembership from './src/models/OrganizationMembership';
import Organization from './src/models/Organization';
import User from './src/models/User';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI as string)
  .then(async () => {
    try {
      const user = await User.findOne({ email: 'cojjojimmy12@gmail.com' });
      if (!user) {
        console.log("User not found!");
        process.exit(0);
      }
      console.log("User found:", user.name, "| Email:", user.email, "| ID:", user._id);

      const memberships = await OrganizationMembership.find({ userId: user._id });
      console.log(`\nFound ${memberships.length} memberships:`);
      
      for (const m of memberships) {
        const org = await Organization.findById(m.organizationId);
        console.log(`- Org Name: ${org?.name} | Role: ${m.role} | Org ID: ${m.organizationId}`);
      }
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  });
