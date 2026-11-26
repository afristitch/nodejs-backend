import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type InventoryLogReason = 'initial' | 'restock' | 'used' | 'damaged' | 'correction';

export interface IInventoryLog extends Document<string> {
    _id: string;
    organizationId: string;
    itemId: string;
    delta: number;
    previousQuantity: number;
    newQuantity: number;
    reason: InventoryLogReason;
    note?: string | null;
    changedBy: string;
    changedByName: string;
    createdAt: Date;
    updatedAt: Date;
}

const inventoryLogSchema = new Schema<IInventoryLog>(
    {
        _id: {
            type: String,
            default: () => uuidv4(),
        },
        organizationId: {
            type: String,
            required: true,
            index: true,
        },
        itemId: {
            type: String,
            required: true,
            index: true,
        },
        delta: {
            type: Number,
            required: true,
        },
        previousQuantity: {
            type: Number,
            required: true,
        },
        newQuantity: {
            type: Number,
            required: true,
            min: 0,
        },
        reason: {
            type: String,
            enum: ['initial', 'restock', 'used', 'damaged', 'correction'],
            default: 'correction',
        },
        note: {
            type: String,
            trim: true,
            maxlength: [300, 'Note cannot exceed 300 characters'],
            default: null,
        },
        changedBy: {
            type: String,
            required: true,
        },
        changedByName: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        _id: false,
    }
);

inventoryLogSchema.index({ organizationId: 1, itemId: 1, createdAt: -1 });

export default mongoose.model<IInventoryLog>('InventoryLog', inventoryLogSchema);
