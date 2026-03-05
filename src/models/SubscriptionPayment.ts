import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * Subscription Payment Interface
 */
export interface ISubscriptionPayment {
    _id: string;
    organizationId: string;
    planId: string;
    amount: number;
    currency: string;
    months: number;
    status: 'success' | 'failed' | 'pending';
    reference: string;
    gateway: string;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Subscription Payment Schema
 * Tracks all subscription-related transactions for auditing
 */
const subscriptionPaymentSchema = new Schema<ISubscriptionPayment>(
    {
        _id: {
            type: String,
            default: () => uuidv4(),
        },
        organizationId: {
            type: String,
            required: true,
            ref: 'Organization',
        },
        planId: {
            type: String,
            required: true,
            ref: 'Plan',
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'GHS',
        },
        months: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['success', 'failed', 'pending'],
            default: 'pending',
        },
        reference: {
            type: String,
            required: true,
            unique: true,
        },
        gateway: {
            type: String,
            default: 'paystack',
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
        _id: false,
    }
);

// Indexes
subscriptionPaymentSchema.index({ organizationId: 1 });
subscriptionPaymentSchema.index({ reference: 1 });
subscriptionPaymentSchema.index({ createdAt: -1 });

export default mongoose.model<ISubscriptionPayment>('SubscriptionPayment', subscriptionPaymentSchema);
