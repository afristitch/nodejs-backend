import { Request, Response, NextFunction } from 'express';
import subscriptionService from '../services/subscription.service';
import paystackService from '../services/paystack.service';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../types';
import crypto from 'crypto';


/**
 * Payment Controller
 * Handles subscription initialization and Paystack webhooks
 */

/**
 * Initialize subscription payment
 * POST /api/v1/payments/initialize
 */
export const initializeSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        const organizationId = req.organizationId;

        if (!user || !organizationId) {
            return errorResponse(res, 'Unauthorized', 401);
        }

        const { planId, callbackUrl, months = 1 } = req.body;

        if (!planId) {
            return errorResponse(res, 'Plan ID is required', 400);
        }

        const initializationData = await subscriptionService.initializeSubscription(
            user.email,
            organizationId,
            planId,
            callbackUrl,
            months
        );


        return successResponse(res, initializationData, 'Payment initialization successful');

    } catch (error: any) {
        return next(error);
    }
};


/**
 * Handle Paystack Webhook
 * POST /api/v1/payments/webhook
 */
export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const hash = crypto
            .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (hash !== req.headers['x-paystack-signature']) {
            return res.status(401).send('Invalid signature');
        }

        // Process webhook event asynchronously
        paystackService.handleWebhook(req.body).catch(err => {
            console.error('Error processing Paystack webhook:', err);
        });

        // Always respond with 200 immediately to Paystack
        return res.status(200).send('Webhook received');
    } catch (error) {
        return next(error);
    }
};

