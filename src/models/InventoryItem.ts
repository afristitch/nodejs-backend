import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type InventoryCategory = 'fabric' | 'trim' | 'tool' | 'finished' | 'other';
export type InventoryUnit = 'yards' | 'meters' | 'pieces' | 'rolls' | 'packs';

export interface IInventoryItem extends Document<string> {
    _id: string;
    organizationId: string;
    name: string;
    category: InventoryCategory;
    quantity: number;
    unit: InventoryUnit;
    lowStockThreshold: number;
    color?: string | null;
    location?: string | null;
    photoUrl?: string | null;
    notes?: string | null;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
    {
        _id: {
            type: String,
            default: () => uuidv4(),
        },
        organizationId: {
            type: String,
            required: [true, 'Organization ID is required'],
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Item name is required'],
            trim: true,
            maxlength: [120, 'Item name cannot exceed 120 characters'],
        },
        category: {
            type: String,
            enum: ['fabric', 'trim', 'tool', 'finished', 'other'],
            default: 'fabric',
        },
        quantity: {
            type: Number,
            required: true,
            default: 0,
            min: [0, 'Quantity cannot be negative'],
        },
        unit: {
            type: String,
            enum: ['yards', 'meters', 'pieces', 'rolls', 'packs'],
            default: 'yards',
        },
        lowStockThreshold: {
            type: Number,
            default: 0,
            min: [0, 'Low stock threshold cannot be negative'],
        },
        color: {
            type: String,
            trim: true,
            maxlength: [60, 'Color cannot exceed 60 characters'],
            default: null,
        },
        location: {
            type: String,
            trim: true,
            maxlength: [120, 'Location cannot exceed 120 characters'],
            default: null,
        },
        photoUrl: {
            type: String,
            default: null,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [500, 'Notes cannot exceed 500 characters'],
            default: null,
        },
        createdBy: {
            type: String,
            required: true,
        },
        updatedBy: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        _id: false,
    }
);

inventoryItemSchema.index({ organizationId: 1, category: 1 });
inventoryItemSchema.index({ organizationId: 1, name: 1 });

export default mongoose.model<IInventoryItem>('InventoryItem', inventoryItemSchema);
