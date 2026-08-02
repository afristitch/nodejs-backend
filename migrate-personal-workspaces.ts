import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import OrganizationMembership from './src/models/OrganizationMembership';
import Organization from './src/models/Organization';
import User from './src/models/User';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI as string)
  .then(async () => {
    try {
      const users = await User.find({});
      console.log(`Checking ${users.length} users...`);
      let count = 0;
      
      for (const user of users) {
        const memberships = await OrganizationMembership.find({ userId: user._id });
        const hasAdmin = memberships.some(m => m.role === 'ORG_ADMIN');
        
        if (!hasAdmin) {
          console.log(`User ${user.email} (${user.name}) has no ORG_ADMIN workspace. Creating one...`);
          
          const personalOrg = new Organization({
              name: `${user.name.split(' ')[0]}'s Workspace`,
              email: user.email,
              phone: (user as any).phone || '',
              subscriptionPlan: 'free',
              subscriptionStatus: 'active',
              createdBy: user._id
          });
          await personalOrg.save();

          const personalMembership = new OrganizationMembership({
              userId: user._id,
              organizationId: personalOrg._id,
              role: 'ORG_ADMIN',
              status: 'active'
          });
          await personalMembership.save();
          count++;
        }
      }
      console.log(`Created ${count} personal workspaces.`);
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  });
