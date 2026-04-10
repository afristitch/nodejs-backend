import express, { Request, Response } from 'express';
import os from 'os';
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
import systemRoutes from './system.routes';
import notificationRoutes from './notification.routes';
import styleRoutes from './style.routes';


const router = express.Router();


/**
 * API Routes - Version 1
 */

// Health check
router.get('/health', (_req: Request, res: Response) => {
    const memoryUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const [load1m, load5m, load15m] = os.loadavg();
    const cpuCount = os.cpus().length;

    res.json({
        success: true,
        message: 'Tailor API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        platform: process.platform,
        metrics: {
            memory: {
                // Process-level
                heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024 / 1024).toFixed(3)} GB`,
                heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024 / 1024).toFixed(3)} GB`,
                rss: `${(memoryUsage.rss / 1024 / 1024 / 1024).toFixed(3)} GB`,
                // System-level
                systemTotal: `${(totalMem / 1024 / 1024 / 1024).toFixed(3)} GB`,
                systemUsed: `${(usedMem / 1024 / 1024 / 1024).toFixed(3)} GB`,
                systemFree: `${(freeMem / 1024 / 1024 / 1024).toFixed(3)} GB`,
                systemUsagePercent: `${Math.round(usedMem / totalMem * 100)}%`,
            },
            cpu: {
                // Load average as a % of available CPUs (Unix standard)
                load1m: `${(load1m / cpuCount * 100).toFixed(1)}%`,
                load5m: `${(load5m / cpuCount * 100).toFixed(1)}%`,
                load15m: `${(load15m / cpuCount * 100).toFixed(1)}%`,
                cores: cpuCount,
            },
        }
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
router.use('/system', systemRoutes);
router.use('/notifications', notificationRoutes);
router.use('/styles', styleRoutes);


export default router;

