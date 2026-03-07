import Order from '../models/Order';
import { IOrder, PaginationOptions } from '../types';

/**
 * Order Service
 * Handles order business logic
 */

/**
 * Create a new order
 */
export const createOrder = async (
    organizationId: string,
    orderData: any,
    userId: string
): Promise<IOrder> => {
    // Generate order number
    const orderNumber = await (Order as any).generateOrderNumber(organizationId);

    const order = new Order({
        ...orderData,
        orderNumber,
        organizationId,
        createdBy: userId,
    });

    await order.save();

    // Trigger notification
    try {
        const notificationService = require('./notification.service').default;
        await notificationService.sendToUser(userId, {
            title: 'New Order Created',
            message: `Order #${orderNumber} has been successfully created.`,
            type: 'ORDER_CREATED',
            data: { orderId: order._id.toString() },
        });
    } catch (error) {
        // Don't fail the request if notification fails
        console.error('Failed to send order creation notification', error);
    }

    return order;
};

/**
 * Get all orders in an organization
 */
export const getOrders = async (
    organizationId: string,
    options: PaginationOptions,
    filters: any = {}
): Promise<{ orders: IOrder[]; total: number }> => {

    const orders = await Order.find({ organizationId })
        .populate('client', 'name phone email photoUrl');

    console.log("STEP 4:", orders.length);



    console.log("STEP 1 - FILTERS:", filters);
    console.log("STEP 1 - OPTIONS:", options);

    return { orders, total: orders.length };

};


/**
 * Get order by ID
 */
export const getOrderById = async (id: string, organizationId: string): Promise<IOrder> => {
    const order = await Order.findOne({ _id: id, organizationId }).populate(
        'client',
        'name phone email photoUrl'
    );

    if (!order) {
        throw new Error('Order not found');
    }

    return order;
};

/**
 * Update order
 */
export const updateOrder = async (
    id: string,
    organizationId: string,
    updateData: any
): Promise<IOrder> => {
    const order = await Order.findOneAndUpdate(
        { _id: id, organizationId },
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!order) {
        throw new Error('Order not found');
    }

    return order;
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
    id: string,
    organizationId: string,
    status: string
): Promise<IOrder> => {
    const order = await Order.findOneAndUpdate(
        { _id: id, organizationId },
        { $set: { status } },
        { new: true }
    );

    if (!order) {
        throw new Error('Order not found');
    }

    // Trigger notification
    try {
        const notificationService = require('./notification.service').default;
        await notificationService.sendToUser(order.createdBy, {
            title: 'Order Status Updated',
            message: `Order #${order.orderNumber} is now ${status}.`,
            type: 'ORDER_STATUS_UPDATED',
            data: { orderId: order._id.toString(), status },
        });
    } catch (error) {
        console.error('Failed to send status update notification', error);
    }

    return order;
};

/**
 * Record payment for an order
 */
export const recordPayment = async (
    id: string,
    organizationId: string,
    amount: number
): Promise<IOrder> => {
    const order = await Order.findOne({ _id: id, organizationId });

    if (!order) {
        throw new Error('Order not found');
    }

    // Check if payment exceeds total
    if (order.amountPaid + amount > order.amount) {
        throw new Error('Payment amount exceeds total order amount');
    }

    order.amountPaid += amount;
    await order.save();

    // Trigger notification
    try {
        const notificationService = require('./notification.service').default;
        await notificationService.sendToUser(order.createdBy, {
            title: 'Payment Received',
            message: `A payment of ${amount} has been recorded for Order #${order.orderNumber}.`,
            type: 'PAYMENT_RECEIVED',
            data: { orderId: order._id.toString(), amount },
        });
    } catch (error) {
        console.error('Failed to send payment notification', error);
    }

    return order;
};

/**
 * Delete order
 */
export const deleteOrder = async (id: string, organizationId: string): Promise<boolean> => {
    const result = await Order.deleteOne({ _id: id, organizationId });

    if (result.deletedCount === 0) {
        throw new Error('Order not found');
    }

    return true;
};

/**
 * Get financial summary for an organization
 */
export const getFinancialSummary = async (
    organizationId: string,
    query: any = {}
): Promise<any> => {
    const match: any = { organizationId };

    // Add date filtering if provided
    if (query.startDate || query.endDate) {
        match.createdAt = {};
        if (query.startDate) match.createdAt.$gte = new Date(query.startDate);
        if (query.endDate) match.createdAt.$lte = new Date(query.endDate);
    }

    const summary = await Order.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$amount' },
                totalCollected: { $sum: '$amountPaid' },
                totalOutstanding: { $sum: { $subtract: ['$amount', '$amountPaid'] } },
            },
        },
    ]);

    return (
        summary[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            totalCollected: 0,
            totalOutstanding: 0,
        }
    );
};

const orderService = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrder,
    updateOrderStatus,
    recordPayment,
    deleteOrder,
    getFinancialSummary,
};

export default orderService;
