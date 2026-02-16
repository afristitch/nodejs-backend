import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IClient } from '../types';

/**
 * Client Schema
 * Represents customers who place orders
 */
const clientSchema = new Schema<IClient>(
    {
        _id: {
            type: String,
            default: () => uuidv4(),
        },
        name: {
            type: String,
            required: [true, 'Client name is required'],
            trim: true,
            maxlength: [100, 'Client name cannot exceed 100 characters'],
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
            default: null,
        },
        photoUrl: {
            type: String,
            trim: true,
            default: null,
        },
        notes: {
            type: String,
            trim: true,
            default: null,
            maxlength: [1000, 'Notes cannot exceed 1000 characters'],
        },
        organizationId: {
            type: String,
            required: [true, 'Organization is required'],
        },
        createdBy: {
            type: String,
            required: [true, 'Creator is required'],
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        _id: false,
    }
);

// Indexes for searching and filtering
clientSchema.index({ organizationId: 1, isDeleted: 1 });
clientSchema.index({ organizationId: 1, name: 1 });
clientSchema.index({ organizationId: 1, phone: 1 });
clientSchema.index({ organizationId: 1, email: 1 });

// Virtual for orders
clientSchema.virtual('orders', {
    ref: 'Order',
    localField: '_id',
    foreignField: 'clientId',
});


export default mongoose.model<IClient>('Client', clientSchema);
