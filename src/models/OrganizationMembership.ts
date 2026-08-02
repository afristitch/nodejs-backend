import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IOrganizationMembership, UserRole } from '../types';

/**
 * Organization Membership Schema
 * Links a User to an Organization with a specific role
 */
const organizationMembershipSchema = new Schema<IOrganizationMembership>(
    {
        _id: {
            type: String,
            default: () => uuidv4(),
        },
        userId: {
            type: String,
            ref: 'User',
            required: true,
            index: true,
        },
        organizationId: {
            type: String,
            ref: 'Organization',
            required: true,
            index: true,
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            required: true,
            default: UserRole.STAFF,
        },
        status: {
            type: String,
            enum: ['active', 'pending_invite', 'suspended'],
            default: 'active',
        },
    },
    {
        timestamps: true,
        _id: false,
    }
);

// A user can only have one membership per organization
organizationMembershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

export default mongoose.model<IOrganizationMembership>('OrganizationMembership', organizationMembershipSchema);
