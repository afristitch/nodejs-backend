import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User';
import Client from '../models/Client';
import OrganizationMembership from '../models/OrganizationMembership';
import { v4 as uuidv4 } from 'uuid';

const firstNames = ['Amina', 'Kwame', 'Chidi', 'Ngozi', 'Fatima', 'Oluwaseun', 'Zainab', 'Kofi', 'Adjoa', 'Tunde', 'Amara', 'Emeka', 'Chioma', 'Yusuf', 'Bola'];
const lastNames = ['Bello', 'Mensah', 'Okafor', 'Adeyemi', 'Ibrahim', 'Ojo', 'Abubakar', 'Osei', 'Appiah', 'Balogun', 'Nwachukwu', 'Obi', 'Eze', 'Okoro', 'Lawal'];

const getRandomName = () => {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${last}`;
};

const getRandomPhone = () => {
    return `+233${Math.floor(200000000 + Math.random() * 800000000)}`;
};

const seedClients = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Database connected.');

        const email = 'google-play@tailor.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        const membership = await OrganizationMembership.findOne({ userId: user._id });
        if (!membership) {
            console.error(`Membership for user with email ${email} not found.`);
            process.exit(1);
        }

        console.log(`Found user ${user.name} with organizationId ${membership.organizationId}.`);

        const clients: any[] = [];
        for (let i = 0; i < 20; i++) {
            const name = getRandomName();
            clients.push({
                _id: uuidv4(),
                name: name,
                phone: getRandomPhone(),
                email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
                notes: `Seeded dummy client ${i + 1}`,
                organizationId: membership.organizationId,
                createdBy: user._id,
                isDeleted: false
            });
        }

        await Client.insertMany(clients);
        console.log(`Successfully seeded 20 clients for organization ${membership.organizationId}.`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding clients:', error);
        process.exit(1);
    }
};

seedClients();
