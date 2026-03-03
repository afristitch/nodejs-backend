import { Request, Response, NextFunction } from 'express';
import revenuecatService, { RevenueCatWebhookBody } from '../services/revenuecat.service';

/**
 * RevenueCat Controller
 * Handles incoming webhook events from RevenueCat
 */

/**
 * Handle RevenueCat Webhook
 * POST /api/v1/revenuecat/webhook
 *
 * RevenueCat uses a simple Authorization header (Bearer token) for security.
 * Set the secret in RevenueCat dashboard → Integrations → Webhooks → Authorization Header.
 */
export const handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
        // Verify the authorization header
        const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
        const authHeader = req.headers['authorization'];

        if (secret && authHeader !== `Bearer ${secret}`) {
            return res.status(401).json({
                success: false,
                message: 'Invalid webhook authorization',
            });
        }

        const body = req.body as RevenueCatWebhookBody;

        if (!body?.event?.type) {
            return res.status(400).json({
                success: false,
                message: 'Invalid webhook payload',
            });
        }

        // Respond immediately with 200 — RevenueCat expects a fast response
        res.status(200).send('Webhook received');

        // Process asynchronously after responding
        revenuecatService.handleWebhook(body).catch(err => {
            console.error('[RevenueCat] Error processing webhook:', err);
        });

    } catch (error) {
        return next(error);
    }
};
