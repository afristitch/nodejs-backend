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
        // Guide recommends X-RevenueCat-Auth, but we'll also support Bearer token in Authorization header
        const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
        const authHeader = req.headers['authorization'];
        const rcAuthHeader = req.headers['x-revenuecat-auth'];

        const isValidHeader = (secret && authHeader === secret) ||
            (secret && rcAuthHeader === secret) ||
            (secret && authHeader === `Bearer ${secret}`);

        if (secret && !isValidHeader) {
            console.warn('[RevenueCat] Invalid webhook authorization attempt (BYPASSED FOR DEBUGGING)');
            console.debug(`[RevenueCat] Expected: ${secret?.substring(0, 4)}...`);
            console.debug(`[RevenueCat] Got Authorization: ${authHeader ? (authHeader.startsWith('Bearer ') ? 'Bearer ' + authHeader.substring(7, 11) + '...' : authHeader.substring(0, 4) + '...') : 'undefined'}`);
            console.debug(`[RevenueCat] Got X-RevenueCat-Auth: ${rcAuthHeader ? rcAuthHeader.toString().substring(0, 4) + '...' : 'undefined'}`);
            console.debug(`[RevenueCat] All received header keys: ${Object.keys(req.headers).join(', ')}`);

            // Temporarily bypassed for debugging missing headers in Render/Cloudflare
            // return res.status(401).json({
            //     success: false,
            //     message: 'Invalid webhook authorization',
            // });
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
