import apn from 'node-apn';
import path from 'path';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const apnsConfig = {
    token: {
        // Support either a file path or the raw key content from an environment variable
        key: process.env.APNS_KEY ? process.env.APNS_KEY.replace(/\\n/g, '\n') : (process.env.APNS_KEY_PATH || path.join(__dirname, '../../secrets/AuthKey_CR4T9TVYZL.p8')),
        keyId: process.env.APNS_KEY_ID || 'CR4T9TVYZL',
        teamId: process.env.APNS_TEAM_ID || '78TZ267D8P',
    },
    production: process.env.APNS_PRODUCTION === 'true',
};

let apnProvider: apn.Provider | null = null;

try {
    // Only initialize if we have the necessary configuration
    if (apnsConfig.token.key && apnsConfig.token.keyId && apnsConfig.token.teamId) {
        apnProvider = new apn.Provider(apnsConfig);
        logger.info('APNS Provider initialized successfully');
    } else {
        logger.warn('APNS Provider not initialized: Missing configuration');
    }
} catch (error) {
    logger.error('Error initializing APNS Provider', { error });
}

export default apnProvider;
