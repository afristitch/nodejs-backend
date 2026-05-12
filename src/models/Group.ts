import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IGroup } from '../types/group';

const groupSchema = new Schema<IGroup>(
    {
        _id: {
            type: String,
            default: () => uuidv4(),
        },
        name: {
            type: String,
            required: [true, 'Group name is required'],
            trim: true,
            maxlength: [100, 'Group name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            default: null,
            maxlength: [500, 'Description cannot exceed 500 characters'],
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

groupSchema.index({ organizationId: 1, isDeleted: 1 });
groupSchema.index({ organizationId: 1, name: 1 });

export default mongoose.model<IGroup>('Group', groupSchema);
