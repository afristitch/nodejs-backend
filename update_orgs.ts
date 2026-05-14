import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from './src/models/Organization';
import { SubscriptionStatus } from './src/types';

dotenv.config();

const updateOrgs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    const orgs = await Organization.find({}).limit(5);
    
    if (orgs.length === 0) {
      console.log('No organizations found to update.');
      return;
    }

    // Mock locations in Ghana
    const locations = [
      { lat: 5.5501, lng: -0.1812, name: 'Osu, Accra' },
      { lat: 5.6322, lng: -0.1654, name: 'East Legon, Accra' },
      { lat: 6.6666, lng: -1.6163, name: 'Kumasi, Ashanti' },
      { lat: 5.6037, lng: -0.1870, name: 'Accra Central' },
      { lat: 5.6148, lng: -0.2058, name: 'Cantonments' }
    ];

    for (let i = 0; i < orgs.length; i++) {
      const org = orgs[i];
      const loc = locations[i % locations.length];
      
      org.subscriptionStatus = SubscriptionStatus.ACTIVE;
      org.latitude = loc.lat;
      org.longitude = loc.lng;
      org.address = org.address || loc.name;
      org.isPublic = true; // Make sure they are public so they show in Explore

      await org.save();
      console.log(`Updated Org: ${org.name} -> Verified, Location: ${loc.name}`);
    }

    console.log('Update complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating orgs:', error);
    process.exit(1);
  }
};

updateOrgs();
