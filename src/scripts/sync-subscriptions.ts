import 'dotenv/config';
import mongoose from 'mongoose';
import Organization from '../models/Organization';
import { SubscriptionStatus } from '../types';
import connectDB from '../config/database';

/**
 * Migration script to synchronize subscription fields for old records
 * Specifically populates subscriptionEndsAt for organizations that are missing it.
 */

const syncSubscriptions = async () => {
    const dryRun = process.argv.includes('--dry-run');
    const force = process.argv.includes('--force');

    console.log(`🚀 Starting Subscription Sync... ${dryRun ? '[DRY RUN MODE]' : ''}`);

    try {
        await connectDB();

        // 1. Find organizations where subscriptionEndsAt is missing
        const query = force ? {} : { subscriptionEndsAt: { $exists: false } };
        const organizations = await Organization.find(query);

        console.log(`🔍 Found ${organizations.length} organizations to process.`);

        let updatedCount = 0;

        for (const org of organizations) {
            // Skip if already has date and not forcing
            if (org.subscriptionEndsAt && !force) continue;

            const createdAt = (org as any).createdAt || new Date();
            let endsAt: Date;

            if (org.subscriptionStatus === SubscriptionStatus.TRIALING || !org.subscriptionStatus) {
                // For trials (or default), set to createdAt + 14 days
                endsAt = new Date(createdAt);
                endsAt.setDate(endsAt.getDate() + 14);

                if (!org.subscriptionStatus) {
                    org.subscriptionStatus = SubscriptionStatus.TRIALING;
                }
            } else if (org.subscriptionStatus === SubscriptionStatus.ACTIVE) {
                // For active premium users, default to 30 days from creation as a buffer 
                // if we don't know when it ends
                endsAt = new Date(createdAt);
                endsAt.setDate(endsAt.getDate() + 30);
            } else {
                // For expired or cancelled, set to createdAt + 14 days as historical record
                endsAt = new Date(createdAt);
                endsAt.setDate(endsAt.getDate() + 14);
            }

            console.log(`📝 Org: ${org.name} (${org._id})`);
            console.log(`   - Status: ${org.subscriptionStatus}`);
            console.log(`   - Created: ${createdAt.toISOString()}`);
            console.log(`   - New EndsAt: ${endsAt.toISOString()}`);

            if (!dryRun) {
                org.subscriptionEndsAt = endsAt;
                await org.save();
                updatedCount++;
            }
        }

        if (dryRun) {
            console.log(`\n✅ Dry run complete. Would have updated ${organizations.length} organizations.`);
        } else {
            console.log(`\n✅ Migration complete. Updated ${updatedCount} organizations.`);
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

syncSubscriptions();
