require('dotenv').config();
const mongoose = require('mongoose');

async function upgradeUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const db = mongoose.connection.db;
        
        const user = await db.collection('users').findOne({ email: 'google-play@tailor.com' });
        if (!user) {
            console.log("User not found!");
            process.exit(1);
        }
        console.log("Found user:", user.email, "Org ID:", user.organizationId);

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const result = await db.collection('organizations').updateOne(
            { _id: user.organizationId },
            { 
                $set: { 
                    subscriptionPlan: 'premium',
                    subscriptionStatus: 'active',
                    subscriptionEndsAt: thirtyDaysFromNow
                } 
            }
        );

        console.log("Update result:", result);
        console.log("Successfully upgraded user to premium for 30 days!");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

upgradeUser();
