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

    // Validate style if provided
    if (orderData.styleId) {
        const style = await require('./style.service').default.getStyleById(orderData.styleId, organizationId);
        if (!style) {
            throw new Error('Valid style is required');
        }
    }

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
    organizationId: string | undefined,
    options: PaginationOptions,
    filters: any = {}
): Promise<{ orders: IOrder[]; total: number }> => {
    const query: any = organizationId ? { organizationId } : {};
    
    // Maintain backward compatibility: Only paginate if explicitly requested
    const shouldPaginate = !!(filters.page && filters.limit);
    
    let ordersQuery = Order.find(query)
        .populate('client', 'name phone email photoUrl')
        .populate('style')
        .sort({ createdAt: -1 });

    if (shouldPaginate) {
        ordersQuery = ordersQuery.skip(options.skip).limit(options.limit);
    }

    const [orders, total] = await Promise.all([
        ordersQuery,
        Order.countDocuments(query),
    ]);

    return { orders, total };
};


/**
 * Get order by ID
 */
export const getOrderById = async (id: string, organizationId: string | undefined): Promise<IOrder> => {
    const query: any = { _id: id };
    if (organizationId) query.organizationId = organizationId;

    const order = await Order.findOne(query)
        .populate('client', 'name phone email photoUrl')
        .populate('style');

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
    // Validate style if provided
    if (updateData.styleId) {
        const style = await require('./style.service').default.getStyleById(updateData.styleId, organizationId);
        if (!style) {
            throw new Error('Valid style is required');
        }
    }

    const query: any = { _id: id };
    if (organizationId) query.organizationId = organizationId;

    const order = await Order.findOneAndUpdate(
        query,
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
    const query: any = { _id: id };
    if (organizationId) query.organizationId = organizationId;

    const order = await Order.findOneAndUpdate(
        query,
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
    organizationId: string | undefined,
    amount: number
): Promise<IOrder> => {
    const query: any = { _id: id };
    if (organizationId) query.organizationId = organizationId;

    const order = await Order.findOne(query);

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
export const deleteOrder = async (id: string, organizationId: string | undefined): Promise<boolean> => {
    const query: any = { _id: id };
    if (organizationId) query.organizationId = organizationId;

    const result = await Order.deleteOne(query);

    if (result.deletedCount === 0) {
        throw new Error('Order not found');
    }

    return true;
};

/**
 * Get financial summary for an organization
 */
export const getFinancialSummary = async (
    organizationId: string | undefined,
    query: any = {}
): Promise<any> => {
    const match: any = organizationId ? { organizationId } : {};

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

/**
 * Get monthly revenue stats for the last 6 months
 */
export const getMonthlyRevenueStats = async (
    organizationId: string | undefined
): Promise<any[]> => {
    const match: any = organizationId ? { organizationId: organizationId } : {};
    
    // Get stats for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    match.createdAt = { $gte: sixMonthsAgo };

    const stats = await Order.aggregate([
        { $match: match },
        {
            $group: {
                _id: {
                    month: { $month: '$createdAt' },
                    year: { $year: '$createdAt' },
                },
                revenue: { $sum: '$amount' },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Format for frontend (e.g., { name: 'Jan', revenue: 4000 })
    return stats.map((item) => {
        const date = new Date(item._id.year, item._id.month - 1);
        return {
            name: date.toLocaleString('default', { month: 'short' }),
            revenue: item.revenue,
        };
    });
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
    getMonthlyRevenueStats,
};

export default orderService;
