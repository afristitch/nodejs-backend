import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IDeviceToken } from '../types';

/**
 * Device Token Schema
 * Stores FCM tokens for different devices/platforms assigned to a user
 */
const deviceTokenSchema = new Schema<IDeviceToken>(
    {
        _id: {
            type: String,
            default: () => uuidv4(),
        },
        userId: {
            type: String,
            required: [true, 'User ID is required'],
            ref: 'User',
        },
        token: {
            type: String,
            required: [true, 'Device token is required'],
            unique: true,
        },
        platform: {
            type: String,
            enum: ['ios', 'android', 'web'],
            required: [true, 'Platform is required'],
        },
        lastUsedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        _id: false,
    }
);

// Indexes
deviceTokenSchema.index({ userId: 1 });
deviceTokenSchema.index({ token: 1 });

export default mongoose.model<IDeviceToken>('DeviceToken', deviceTokenSchema);
