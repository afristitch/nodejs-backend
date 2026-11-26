import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Connect to MongoDB database
 */
const connectDB = async (): Promise<void> => {
    try {
        // Use reliable public DNS to prevent queryTxt ETIMEOUT on networks that block/timeout TXT record lookups
        try {
            dns.setServers(['8.8.8.8', '1.1.1.1']);
        } catch {
            // Fallback silently if custom DNS servers cannot be set
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI!);

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err: Error) => {
            console.error(`MongoDB connection error: ${err}`);
        });

        // Debounce the disconnected event — during replica set topology negotiation the driver
        // briefly closes probe sockets to secondary nodes, firing 'disconnected' many times even
        // though the primary connection is healthy. Wait 2 s before checking readyState so we
        // only warn on a genuine, sustained loss of connection.
        let _disconnectTimer: ReturnType<typeof setTimeout> | null = null;
        mongoose.connection.on('disconnected', () => {
            if (_disconnectTimer) clearTimeout(_disconnectTimer);
            _disconnectTimer = setTimeout(() => {
                if (mongoose.connection.readyState === 0) {
                    console.warn('⚠️ MongoDB disconnected from cluster.');
                }
            }, 2000);
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });
    } catch (error: any) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
