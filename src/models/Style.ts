import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IStyle, StyleGender } from '../types';

/**
 * Style Schema
 * Represents designs/styles that tailors showcase to clients
 */
const styleSchema = new Schema<IStyle>(
    {
        _id: {
            type: String,
            default: () => uuidv4(),
        },
        name: {
            type: String,
            required: [true, 'Style name is required'],
            trim: true,
            maxlength: [100, 'Style name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
            default: null,
        },
        imageUrl: {
            type: String,
            required: [true, 'Image URL is required'],
        },
        gender: {
            type: String,
            enum: Object.values(StyleGender),
            default: StyleGender.UNISEX,
        },
        tags: {
            type: [String],
            default: [],
        },
        organizationId: {
            type: String,
            required: false,
            default: null,
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

// Indexes for faster searching
styleSchema.index({ organizationId: 1, gender: 1 });
styleSchema.index({ organizationId: 1, name: 'text', description: 'text' });

export default mongoose.model<IStyle>('Style', styleSchema);
