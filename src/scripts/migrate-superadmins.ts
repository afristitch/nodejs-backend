import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import OrganizationMembership from '../models/OrganizationMembership';
import Organization from '../models/Organization';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to DB. Finding old SuperAdmins...');

        // Use native collection to bypass schema and find users with old role
        const oldSuperAdmins = await mongoose.connection.collection('users').find({ role: 'SUPER_ADMIN' }).toArray();
        console.log(`Found ${oldSuperAdmins.length} users with legacy SUPER_ADMIN role.`);

        if (oldSuperAdmins.length === 0) {
            console.log('No legacy SuperAdmins found. You may need to run `npm run script:create-superadmin -- your_email@example.com` if you need to manually elevate a specific user.');
            process.exit(0);
        }

        for (const userDoc of oldSuperAdmins) {
            // Find or create the SuperAdmin Organization
            let adminOrg = await Organization.findOne({ name: 'SewDigital SuperAdmin' });
            if (!adminOrg) {
                adminOrg = new Organization({
                    name: 'SewDigital SuperAdmin',
                    email: 'admin@sewdigital.app',
                    subscriptionPlan: 'free',
                    subscriptionStatus: 'active',
                    createdBy: userDoc._id.toString()
                });
                await adminOrg.save();
                console.log('Created SewDigital SuperAdmin organization.');
            }

            // Create or update membership
            await OrganizationMembership.findOneAndUpdate(
                { userId: userDoc._id.toString(), organizationId: adminOrg._id },
                { role: 'SUPER_ADMIN', status: 'active' },
                { upsert: true, new: true }
            );

            console.log(`Migrated SUPER_ADMIN privileges for: ${userDoc.email}`);
        }

        console.log('Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    }
};

run();
