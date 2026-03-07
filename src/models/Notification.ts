import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { INotification } from '../types';

/**
 * Notification Schema
 * Stores in-app notification history for users
 */
const notificationSchema = new Schema<INotification>(
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
        title: {
            type: String,
            required: [true, 'Notification title is required'],
            trim: true,
        },
        message: {
            type: String,
            required: [true, 'Notification message is required'],
            trim: true,
        },
        data: {
            type: Schema.Types.Mixed,
            default: {},
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        type: {
            type: String,
            required: [true, 'Notification type is required'],
            index: true,
        },
    },
    {
        timestamps: true,
        _id: false,
    }
);

// Indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

export default mongoose.model<INotification>('Notification', notificationSchema);
