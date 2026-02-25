import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IPlan } from '../types';

/**
 * Plan Schema
 * Represents a subscription plan definition
 */
const planSchema = new Schema<IPlan>(
    {
        _id: {
            type: String,
            default: () => uuidv4(),
        },
        name: {
            type: String,
            required: [true, 'Plan name is required'],
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            required: [true, 'Plan description is required'],
        },
        price: {
            type: Number,
            required: [true, 'Plan price is required'],
            default: 0,
        },
        currency: {
            type: String,
            default: 'GHS',
        },
        interval: {
            type: String,
            enum: ['monthly', 'yearly'],
            default: 'monthly',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        _id: false,
    }
);

// Indexes
planSchema.index({ name: 1 });
planSchema.index({ isActive: 1 });

export default mongoose.model<IPlan>('Plan', planSchema);
