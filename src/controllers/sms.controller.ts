import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import smsService from '../services/sms.service';
import Order from '../models/Order';
import Client from '../models/Client';
import { checkSmsEligibility } from '../services/subscription.service';
import { successResponse, errorResponse } from '../utils/response';

/**
 * SMS Controller
 * Handles manual order notifications and bulk marketing
 */

/**
 * Notify a client that their order is ready
 * POST /api/v1/sms/order-ready
 */
export const notifyOrderReady = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { orderId } = req.body;
        const organizationId = req.organizationId!;

        // 1. Check eligibility
        const isEligible = await checkSmsEligibility(organizationId);
        if (!isEligible) {
            return errorResponse(res, 'Sms notifications are only available for Premium plans.', 403);
        }

        if (!orderId) {
            return errorResponse(res, 'Order ID is required', 400);
        }

        // 2. Fetch order and client
        const order = await Order.findOne({ _id: orderId, organizationId });
        if (!order) {
            return errorResponse(res, 'Order not found', 404);
        }

        const client = await Client.findById(order.clientId);
        if (!client || !client.phone) {
            return errorResponse(res, 'Client phone number not found', 404);
        }

        // 3. Send SMS
        const message = `Hello ${client.name}, your order (${order.orderNumber}) is ready for pickup/delivery at SewDigital!`;
        await smsService.sendSMS([client.phone], message);

        return successResponse(res, null, 'Notification sent successfully');
    } catch (error: any) {
        return next(error);
    }
};

/**
 * Send bulk marketing SMS to all clients
 * POST /api/v1/sms/bulk
 */
export const sendBulkMarketing = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { message } = req.body;
        const organizationId = req.organizationId!;

        // 1. Check eligibility
        const isEligible = await checkSmsEligibility(organizationId);
        if (!isEligible) {
            return errorResponse(res, 'Bulk SMS marketing is only available for Premium plans.', 403);
        }

        if (!message) {
            return errorResponse(res, 'Message content is required', 400);
        }

        // 2. Fetch all clients with phone numbers
        const clients = await Client.find({ organizationId, isDeleted: false, phone: { $ne: null } });
        const recipients = clients.map(c => c.phone).filter(p => !!p);

        if (recipients.length === 0) {
            return errorResponse(res, 'No clients with phone numbers found', 404);
        }

        // 3. Send Bulk SMS
        await smsService.sendSMS(recipients, message);

        return successResponse(res, { count: recipients.length }, 'Bulk SMS sent successfully');
    } catch (error: any) {
        return next(error);
    }
};

const smsController = {
    notifyOrderReady,
    sendBulkMarketing,
};

export default smsController;
