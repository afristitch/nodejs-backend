import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function runMigration() {
  if (!MONGODB_URI) {
    console.error('No MONGODB_URI found in environment');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection is not established');

    const usersCollection = db.collection('users');
    const membershipsCollection = db.collection('organizationmemberships');

    // Find users who still have organizationId and role
    const users = await usersCollection.find({ organizationId: { $exists: true } }).toArray();
    console.log(`Found ${users.length} users to migrate.`);

    let migratedCount = 0;

    for (const user of users) {
      if (!user.organizationId || !user.role) continue;

      // Check if membership already exists to prevent duplicates
      const existingMembership = await membershipsCollection.findOne({
        userId: user._id,
        organizationId: user.organizationId,
      });

      if (!existingMembership) {
        await membershipsCollection.insertOne({
          _id: uuidv4(),
          userId: user._id,
          organizationId: user.organizationId,
          role: user.role,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }

      // Unset organizationId and role from the user
      await usersCollection.updateOne(
        { _id: user._id },
        { $unset: { organizationId: "", role: "" } }
      );

      migratedCount++;
    }

    console.log(`Migration completed successfully. Migrated ${migratedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
