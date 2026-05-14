const mongoose = require('mongoose');
require('dotenv').config({ path: '/home/jimmy/Desktop/personal/Tailor/tailor-api-node/.env' });

async function checkOrgs() {
  await mongoose.connect(process.env.MONGODB_URI);
  const orgSchema = new mongoose.Schema({}, { strict: false });
  const Organization = mongoose.model('Organization', orgSchema);
  
  const orgs = await Organization.find();
  console.log(`Found ${orgs.length} orgs:`);
  orgs.forEach(o => console.log(`- ${o.name} (ID: ${o._id})`));
  
  process.exit(0);
}

checkOrgs();
