import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import errorMiddleware from './middlewares/error.middleware';
import { loggingMiddleware } from './middlewares/logging.middleware';
import './config/firebase';
import maintenanceMiddleware from './middlewares/maintenance.middleware';

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
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'https://sewdigital.app',
    'https://www.sewdigital.app',
    'https://monitoring.sewdigital.app',
].filter(Boolean) as string[];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                callback(null, true);
            } else {
                // If NODE_ENV is development, be more permissive
                if (process.env.NODE_ENV === 'development') {
                    return callback(null, true);
                }
                callback(new Error('Not allowed by CORS'));
            }
        },
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

// Maintenance Mode Middleware (Global)
app.use(maintenanceMiddleware);

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