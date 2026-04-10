import mongoose, { Schema } from 'mongoose';
import { ISystemSettings } from '../types';

/**
 * System Settings Schema
 * Stores global configuration for the platform
 */
const systemSettingsSchema = new Schema<ISystemSettings>(
    {
        monitoringEnabled: {
            type: Boolean,
            default: true,
        },
        checkInterval: {
            type: Number,
            default: 60,
            min: [5, 'Interval cannot be less than 5 seconds'],
            max: [3600, 'Interval cannot exceed 1 hour'],
        },
    },
    {
        timestamps: { createdAt: false, updatedAt: true },
        versionKey: false,
    }
);

export default mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);
