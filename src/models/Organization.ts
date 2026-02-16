import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IOrganization } from '../types';

/**
 * Organization Schema
 * Represents a tailor/dressmaker business
 */
const organizationSchema = new Schema<IOrganization>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },
    logoUrl: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      required: [true, 'Organization email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Organization phone is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    _id: false, // Disable auto ObjectId generation
  }
);

// Indexes
organizationSchema.index({ email: 1 });
organizationSchema.index({ createdBy: 1 });

// Virtual for users belonging to this organization
organizationSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'organizationId',
});

export default mongoose.model<IOrganization>('Organization', organizationSchema);
