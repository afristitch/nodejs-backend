import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IMeasurementTemplate } from '../types';

/**
 * Measurement Template Schema
 * Defines reusable measurement field templates
 */
const measurementTemplateSchema = new Schema<IMeasurementTemplate>(
    {
        _id: {
            type: String,
            default: () => uuidv4(),
        },
        name: {
            type: String,
            required: [true, 'Template name is required'],
            trim: true,
            maxlength: [100, 'Template name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
            default: null,
        },
        fields: [
            {
                name: {
                    type: String,
                    required: true,
                    trim: true,
                },
                unit: {
                    type: String,
                    default: 'inches',
                    trim: true,
                },
                description: {
                    type: String,
                    trim: true,
                    default: null,
                },
            },
        ],
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
measurementTemplateSchema.index({ organizationId: 1, name: 1 });

export default mongoose.model<IMeasurementTemplate>('MeasurementTemplate', measurementTemplateSchema);
