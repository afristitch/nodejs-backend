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
        maintenanceMode: {
            type: Boolean,
            default: false,
        },
        maintenanceMessage: {
            type: String,
            default: 'System is currently under maintenance. Please try again later.',
        },
        latestIosVersion: {
            type: String,
            default: '1.0.0',
        },
        latestAndroidVersion: {
            type: String,
            default: '1.0.0',
        },
        iosUpdateUrl: {
            type: String,
            default: '',
        },
        androidUpdateUrl: {
            type: String,
            default: '',
        },
        forceUpdate: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: { createdAt: false, updatedAt: true },
        versionKey: false,
    }
);

export default mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);
