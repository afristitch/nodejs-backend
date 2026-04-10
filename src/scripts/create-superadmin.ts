import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import { UserRole } from '../types';
import connectDB from '../config/database';

/**
 * Script to create Super Admin account
 * Usage: npm run script:create-superadmin -- "Name" "email" "password"
 */
const createSuperAdmin = async () => {
    const name = process.argv[2] || process.env.SUPERADMIN_NAME || 'Super Admin';
    const email = process.argv[3] || process.env.SUPERADMIN_EMAIL;
    const password = process.argv[4] || process.env.SUPERADMIN_PASSWORD;

    if (!email || !password) {
        console.error('❌ Email and Password are required.');
        console.log('Usage: npm run script:create-superadmin -- "Name" "email@example.com" "password"');
        console.log('Or set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in .env');
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
            if (existingUser.role === UserRole.SUPER_ADMIN) {
                console.log(`ℹ️ Super Admin ${email} already exists. Updating password...`);
                existingUser.password = password;
                await existingUser.save();
                console.log('✅ Password updated successfully!');
            } else {
                console.error(`❌ User with email ${email} exists but is not a Super Admin.`);
                process.exit(1);
            }
        } else {
            // Create user
            console.log('Creating Super Admin...');
            const user = new User({
                name,
                email,
                password,
                role: UserRole.SUPER_ADMIN,
                isEmailVerified: true,
                // organizationId is optional for SUPER_ADMIN
            });

            await user.save();

            console.log('\n✅ Super Admin account created successfully!');
            console.log('-------------------------------------------');
            console.log(`Name:     ${name}`);
            console.log(`Email:    ${email}`);
            console.log(`Password: ${password}`);
            console.log('-------------------------------------------');
        }

    } catch (error: any) {
        console.error('❌ Failed to create Super Admin:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

createSuperAdmin();
