import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IMeasurement } from '../types';

/**
 * Measurement Schema
 * Stores actual measurement values for a client
 */
const measurementSchema = new Schema<IMeasurement>(
    {
        _id: {
            type: String,
            default: () => uuidv4(),
        },
        clientId: {
            type: String,
            required: [true, 'Client is required'],
            index: true,
        },
        orderId: {
            type: String,
            default: null,
            index: true,
        },
        templateId: {
            type: String,
            required: [true, 'Template is required'],
        },
        values: {
            type: Map,
            of: String,
            required: true,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [1000, 'Notes cannot exceed 1000 characters'],
            default: null,
        },
        organizationId: {
            type: String,
            required: [true, 'Organization is required'],
            index: true,
        },
        createdBy: {
            type: String,
            required: [true, 'Creator is required'],
        },
    },
    {
        timestamps: true,
        _id: false,
    }
);

// Indexes
measurementSchema.index({ organizationId: 1, clientId: 1 });
measurementSchema.index({ organizationId: 1, orderId: 1 });

export default mongoose.model<IMeasurement>('Measurement', measurementSchema);
