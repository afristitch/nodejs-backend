import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IProforma } from '../types';

const quoteItemSchema = new Schema(
    {
        id: { type: String, required: true },
        description: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 }
    },
    { _id: false }
);

const proformaSchema = new Schema<IProforma>(
    {
        _id: {
            type: String,
            default: () => uuidv4(),
        },
        clientName: {
            type: String,
            required: [true, 'Client name is required'],
            trim: true,
        },
        clientPhone: {
            type: String,
            required: [true, 'Client phone is required'],
            trim: true,
        },
        clientAddress: {
            type: String,
            trim: true,
            default: null,
        },
        items: {
            type: [quoteItemSchema],
            required: true,
            validate: [
                (val: any[]) => val.length > 0,
                'A quote must have at least one item'
            ]
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0
        },
        notes: {
            type: String,
            trim: true,
            default: null,
        },
        organizationId: {
            type: String,
            required: [true, 'Organization ID is required'],
            index: true
        },
        createdBy: {
            type: String,
            required: [true, 'Creator ID is required'],
        },
    },
    {
        timestamps: true,
        _id: false,
    }
);

// Indexes
proformaSchema.index({ organizationId: 1, createdAt: -1 });

export default mongoose.model<IProforma>('Proforma', proformaSchema);
