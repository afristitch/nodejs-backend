import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IGroupMember } from '../types/group';

const groupMemberSchema = new Schema<IGroupMember>(
    {
        _id: {
            type: String,
            default: () => uuidv4(),
        },
        groupId: {
            type: String,
            required: [true, 'Group is required'],
        },
        clientId: {
            type: String,
            required: [true, 'Client is required'],
        },
        organizationId: {
            type: String,
            required: [true, 'Organization is required'],
        },
    },
    {
        timestamps: true,
        _id: false,
    }
);

groupMemberSchema.index({ groupId: 1 });
groupMemberSchema.index({ clientId: 1 });
groupMemberSchema.index({ groupId: 1, clientId: 1 }, { unique: true });

export default mongoose.model<IGroupMember>('GroupMember', groupMemberSchema);
