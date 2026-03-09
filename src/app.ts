import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import errorMiddleware from './middlewares/error.middleware';
import { loggingMiddleware } from './middlewares/logging.middleware';
import './config/firebase';

/**
 * Express Application Setup
 */
const app = express();

// Trust proxy for rate limiting (needed for Render/Cloudflare)
app.set('trust proxy', 1);

// Global request logging
app.use(loggingMiddleware);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
    cors({
        origin: process.env.FRONTEND_URL || '*',
        credentials: true,
    })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100') || 100,
    message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// API Routes
app.use('/api/v1', routes);

// Root route
app.get('/', (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Welcome to Tailor & Dressmaker Management API',
        version: '1.0.0',
        documentation: '/api/v1/health',
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

export default app;
