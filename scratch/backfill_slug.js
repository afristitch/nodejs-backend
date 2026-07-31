require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Need to use mongoose.model instead of require since ts isn't compiled
    const db = mongoose.connection;
    const orgs = await db.collection('organizations').find({ slug: { $exists: false } }).toArray();
    
    console.log(`Found ${orgs.length} orgs to backfill`);
    
    for (const org of orgs) {
      const baseSlug = (org.name || 'org').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const randomString = Math.random().toString(36).substring(2, 8);
      const slug = baseSlug ? `${baseSlug}-${randomString}` : randomString;
      
      await db.collection('organizations').updateOne(
        { _id: org._id },
        { $set: { slug } }
      );
    }
    
    console.log("Backfill complete");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}
run();
