import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IQuoteRequest, QuoteRequestStatus } from '../types';

/**
 * Quote Request Schema
 * Handles inquiries from prospective customers to tailors
 */
const quoteRequestSchema = new Schema<IQuoteRequest>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    tailorId: {
      type: String,
      required: [true, 'Tailor ID is required'],
      ref: 'Organization',
    },
    customerId: {
      type: String,
      ref: 'User',
      default: null,
    },
    guestInfo: {
      name: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
    },
    details: {
      type: String,
      required: [true, 'Inquiry details are required'],
      trim: true,
    },
    quoteAmount: {
      type: Number,
      default: null,
    },
    quoteItems: [
      {
        description: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    pdfUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(QuoteRequestStatus),
      default: QuoteRequestStatus.PENDING,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

// Indexes
quoteRequestSchema.index({ tailorId: 1, createdAt: -1 });
quoteRequestSchema.index({ customerId: 1 });
quoteRequestSchema.index({ status: 1 });

export default mongoose.model<IQuoteRequest>('QuoteRequest', quoteRequestSchema);
