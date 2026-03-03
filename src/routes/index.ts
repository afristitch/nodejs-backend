import express, { Request, Response } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import clientRoutes from './client.routes';
import measurementRoutes from './measurement.routes';
import orderRoutes from './order.routes';
import organizationRoutes from './organization.routes';
import profileRoutes from './profile.routes';
import uploadRoutes from './upload.routes';
import paymentRoutes from './payment.routes';
import planRoutes from './plan.routes';
import smsRoutes from './sms.routes';
import revenuecatRoutes from './revenuecat.routes';


const router = express.Router();


/**
 * API Routes - Version 1
 */

// Health check
router.get('/health', (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Tailor API is running',
        timestamp: new Date().toISOString(),
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/measurements', measurementRoutes);
router.use('/orders', orderRoutes);
router.use('/organization', organizationRoutes);
router.use('/profile', profileRoutes);
router.use('/upload', uploadRoutes);
router.use('/payments', paymentRoutes);
router.use('/plans', planRoutes);
router.use('/sms', smsRoutes);
router.use('/revenuecat', revenuecatRoutes);


export default router;

