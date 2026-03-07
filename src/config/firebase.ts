import * as admin from 'firebase-admin';
import logger from '../utils/logger';

/**
 * Initialize Firebase Admin SDK
 */
const initializeFirebase = () => {
    try {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!projectId || !clientEmail || !privateKey) {
            logger.warn('Firebase configuration missing. Push notifications will be disabled.');
            return null;
        }

        const app = admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });

        logger.info('Firebase Admin SDK initialized successfully');
        return app;
    } catch (error) {
        logger.error('Failed to initialize Firebase Admin SDK', { error });
        return null;
    }
};

const firebaseApp = initializeFirebase();

export default firebaseApp;
