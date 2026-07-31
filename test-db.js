const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '/home/jimmy/Desktop/personal/Tailor/tailor-api-node/.env' });

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const OrganizationMembership = require('/home/jimmy/Desktop/personal/Tailor/tailor-api-node/src/models/OrganizationMembership').default;
    const Organization = require('/home/jimmy/Desktop/personal/Tailor/tailor-api-node/src/models/Organization').default;
    const User = require('/home/jimmy/Desktop/personal/Tailor/tailor-api-node/src/models/User').default;
    
    const user = await User.findOne({ email: 'google-play@tailor.com' });
    console.log("User:", user.name);

    const memberships = await OrganizationMembership.find({ userId: user._id });
    console.log("Memberships:", memberships);
    process.exit(0);
  });
