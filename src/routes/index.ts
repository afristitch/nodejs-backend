import express, { Request, Response } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import clientRoutes from './client.routes';
import measurementRoutes from './measurement.routes';
import orderRoutes from './order.routes';
import organizationRoutes from './organization.routes';
import profileRoutes from './profile.routes';

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

export default router;
