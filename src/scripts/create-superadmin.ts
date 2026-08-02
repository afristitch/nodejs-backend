import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User';
import OrganizationMembership from '../models/OrganizationMembership';
import Organization from '../models/Organization';

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const email = process.argv[2];
    
    if (!email) {
        console.error('Please provide an email. Example: npm run make-superadmin you@example.com');
        process.exit(1);
    }

    const user = await User.findOne({ email });
    if (!user) {
        console.error('User not found');
        process.exit(1);
    }

    // Try to find the SuperAdmin organization, or create one
    let adminOrg = await Organization.findOne({ name: 'SewDigital SuperAdmin' });
    if (!adminOrg) {
        adminOrg = new Organization({
            name: 'SewDigital SuperAdmin',
            email: 'admin@sewdigital.app',
            subscriptionPlan: 'free',
            subscriptionStatus: 'ACTIVE',
            createdBy: user._id
        });
        await adminOrg.save();
    }

    // Create or update membership
    await OrganizationMembership.findOneAndUpdate(
        { userId: user._id, organizationId: adminOrg._id },
        { role: 'SUPER_ADMIN', status: 'active' },
        { upsert: true, new: true }
    );

    console.log(`Successfully granted SUPER_ADMIN privileges to ${email}`);
    process.exit(0);
};

run().catch(console.error);
