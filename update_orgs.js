const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '/home/jimmy/Desktop/personal/Tailor/tailor-api-node/.env' });

// Define Schema inline to avoid import issues
const orgSchema = new mongoose.Schema({
  _id: String,
  name: String,
  subscriptionStatus: String,
  latitude: Number,
  longitude: Number,
  address: String,
  isPublic: Boolean
}, { timestamps: true });

const Organization = mongoose.model('Organization', orgSchema);

const updateOrgs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const orgs = await Organization.find({}).limit(10);
    
    if (orgs.length === 0) {
      console.log('No organizations found to update.');
      return;
    }

    const locations = [
      { lat: 5.5501, lng: -0.1812, name: 'Osu, Accra' },
      { lat: 5.6322, lng: -0.1654, name: 'East Legon, Accra' },
      { lat: 6.6666, lng: -1.6163, name: 'Kumasi, Ashanti' },
      { lat: 5.6037, lng: -0.1870, name: 'Accra Central' },
      { lat: 5.6148, lng: -0.2058, name: 'Cantonments' }
    ];

    const https = require('https');
    
    for (let i = 0; i < orgs.length; i++) {
      const org = orgs[i];
      
      if (org.latitude && org.longitude) {
        try {
          console.log(`Reverse geocoding for ${org.name}...`);
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${org.latitude}&lon=${org.longitude}&format=json&addressdetails=1`;
          
          const data = await new Promise((resolve, reject) => {
            https.get(url, {
              headers: { 'User-Agent': 'SewDigital-App-Seeder' }
            }, (res) => {
              let body = '';
              res.on('data', (chunk) => body += chunk);
              res.on('end', () => {
                try {
                  resolve(JSON.parse(body));
                } catch (e) {
                  reject(e);
                }
              });
            }).on('error', reject);
          });

          if (data && data.address) {
            const addr = data.address;
            const parts = [
              addr.road || addr.suburb || addr.neighbourhood,
              addr.city || addr.town || addr.district,
              addr.region || addr.state || addr.county
            ].filter(Boolean);
            
            org.address = parts.join(", ");
            console.log(`  -> Inferred Address: ${org.address}`);
          }
        } catch (error) {
          console.error(`  -> Error geocoding ${org.name}: ${error.message}`);
        }
      }

      org.subscriptionStatus = 'active';
      org.isPublic = true;

      await org.save();
      await new Promise(resolve => setTimeout(resolve, 1100));
    }

    console.log('Update complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating orgs:', error);
    process.exit(1);
  }
};

updateOrgs();
