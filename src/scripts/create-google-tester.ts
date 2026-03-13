import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import Organization from '../models/Organization';
import Plan from '../models/Plan';
import { SubscriptionStatus, UserRole } from '../types';
import connectDB from '../config/database';

/**
 * Script to create Google tester accounts
 * Usage: npm run script:create-google-tester -- "Name" "email" "password"
 */
const createGoogleTester = async () => {
    const name = process.argv[2] || 'Google Tester';
    const email = process.argv[3];
    const password = process.argv[4] || 'GoogleTester123!';

    if (!email) {
        console.error('❌ Email is required: npm run script:create-google-tester -- "Name" "email@example.com" "password"');
        process.exit(1);
    }

    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Connected to database.');

        // Check if user already exists
        console.log(`Checking if user ${email} exists...`);
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.error(`❌ User with email ${email} already exists.`);
            process.exit(1);
        }

        // Get free plan
        console.log('Fetching free plan...');
        const freePlan = await Plan.findOne({ name: 'free' });

        const subscriptionEndsAt = new Date();
        subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + 14);

        // Create organization
        console.log('Creating organization...');
        const organization = new Organization({
            name: `${name} Org`,
            email: email,
            createdBy: 'temp', // Updated later
            subscriptionStatus: SubscriptionStatus.TRIALING,
            subscriptionPlan: 'free',
            planId: freePlan?._id || null,
            subscriptionEndsAt,
        });

        // Create user
        console.log('Creating user...');
        const user = new User({
            name,
            email,
            password,
            role: UserRole.ORG_ADMIN,
            organizationId: organization._id,
            isEmailVerified: true,
        });

        organization.createdBy = user._id;

        console.log('Saving user and organization...');
        await user.save();
        await organization.save();

        console.log('\n✅ Google Tester account created successfully!');
        console.log('-------------------------------------------');
        console.log(`Name:     ${name}`);
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Org ID:   ${organization._id}`);
        console.log(`Trial:    Ends on ${subscriptionEndsAt.toISOString()}`);
        console.log('-------------------------------------------');

    } catch (error: any) {
        console.error('❌ Failed to create tester account:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

createGoogleTester();
