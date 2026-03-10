import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IOrder, OrderStatus, PaymentStatus } from '../types';

/**
 * Order Schema
 * Represents orders placed by clients
 */
const orderSchema = new Schema<IOrder>(
    {
        _id: {
            type: String,
            default: () => uuidv4(),
        },
        clientId: {
            type: String,
            required: [true, 'Client is required'],
            ref: 'Client',
        },
        measurementsId: {
            type: String,
            default: null,
        },
        orderNumber: {
            type: String,
            required: true,
            // Removed global unique constraint to allow same ORD numbers in different organizations
        },
        status: {
            type: String,
            enum: Object.values(OrderStatus),
            default: OrderStatus.PENDING,
        },
        amount: {
            type: Number,
            required: [true, 'Order amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
        amountPaid: {
            type: Number,
            default: 0,
            min: [0, 'Amount paid cannot be negative'],
        },
        paymentStatus: {
            type: String,
            enum: Object.values(PaymentStatus),
            default: PaymentStatus.UNPAID,
        },
        dueDate: {
            type: Date,
            default: null,
        },
        deliveryDate: {
            type: Date,
            default: null,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [2000, 'Notes cannot exceed 2000 characters'],
            default: null,
        },
        clothImageUrl: {
            type: String,
            default: null,
        },
        clothSize: {
            type: String,
            trim: true,
            default: null,
        },
        organizationId: {
            type: String,
            required: [true, 'Organization is required'],
        },
        createdBy: {
            type: String,
            required: [true, 'Creator is required'],
        },
    },
    {
        timestamps: true,
        _id: false,
    }
);

// Indexes
orderSchema.index({ organizationId: 1, status: 1 });
orderSchema.index({ organizationId: 1, clientId: 1 });
orderSchema.index({ organizationId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ organizationId: 1, paymentStatus: 1 });

// Virtual field for balance
orderSchema.virtual('balance').get(function (this: IOrder) {
    return this.amount - this.amountPaid;
});

orderSchema.virtual('client', {
    ref: 'Client',      // refers to Client model
    localField: 'clientId', // stored in DB
    foreignField: '_id',    // Client._id
    justOne: true,           // single object, not array
});

// Ensure virtuals are included in JSON responses
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

// Pre-save hook to update payment status
orderSchema.pre('save', function (next) {
    if (this.amountPaid >= this.amount) {
        this.paymentStatus = PaymentStatus.PAID;
    } else if (this.amountPaid > 0) {
        this.paymentStatus = PaymentStatus.PARTIAL;
    } else {
        this.paymentStatus = PaymentStatus.UNPAID;
    }
    next();
});

// Static method to generate order number
orderSchema.statics.generateOrderNumber = async function (
    organizationId: string
): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const prefix = `ORD-${year}${month}`;
    const lastOrder = await this.findOne({
        organizationId,
        orderNumber: new RegExp(`^${prefix}`),
    })
        .sort({ orderNumber: -1 })
        .select('orderNumber');

    let sequence = 1;
    if (lastOrder) {
        const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
        sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

export default mongoose.model<IOrder>('Order', orderSchema);
