import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IOrganization, SubscriptionStatus } from '../types';


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
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      set: (v: string) => (v === '' ? null : v),
    },
    phone: {
      type: String,
      trim: true,
      set: (v: string) => (v === '' ? null : v),
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
    subscriptionPlan: {
      type: String,
      default: 'free',
    },
    planId: {
      type: String,
      ref: 'Plan',
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.TRIALING,
    } as any,

    subscriptionEndsAt: {
      type: Date,
      default: null,
    },
    revenuecatAppUserId: {
      type: String,
      default: null,
    },
    trialExpiryNotificationSent: {
      type: Boolean,
      default: false,
    },
    
    // Discovery fields
    isPublic: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      trim: true,
      default: null,
    },
    specialties: {
      type: [String],
      default: [],
    },
    portfolioUrls: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    referralCode: {
      type: String,
      trim: true,
      default: null,
    },
    paymentInstructions: {
      momo: [{
        network: String,
        number: String,
        name: String,
      }],
      bank: [{
        bankName: String,
        accountNumber: String,
        accountName: String,
        branch: String,
      }],
      generalNote: String,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    _id: false, // Disable auto ObjectId generation
  }
);

// Indexes
organizationSchema.index({ createdBy: 1 });

// Virtual for users belonging to this organization
organizationSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'organizationId',
});

export default mongoose.model<IOrganization>('Organization', organizationSchema);
