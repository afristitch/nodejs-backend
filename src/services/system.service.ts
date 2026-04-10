import SystemSettings from '../models/SystemSettings';
import { ISystemSettings } from '../types';

/**
 * System Service
 * Manages global system settings and operations
 */

/**
 * Get system settings, create default if none exist
 */
const getSettings = async (): Promise<ISystemSettings> => {
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
        settings = await SystemSettings.create({});
    }
    
    return settings;
};

/**
 * Update system settings
 */
const updateSettings = async (data: Partial<ISystemSettings>): Promise<ISystemSettings> => {
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
        settings = new SystemSettings(data);
    } else {
        Object.assign(settings, data);
    }
    
    await settings.save();
    return settings;
};

const systemService = {
    getSettings,
    updateSettings,
};

export default systemService;
