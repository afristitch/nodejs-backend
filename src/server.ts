require('dotenv').config();
import app from './app';
import connectDB from './config/database';

/**
 * Server Entry Point
 */

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Seed default plans
        const planService = require('./services/plan.service').default;
        await planService.seedPlans();


        // Start listening
        const server = app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🪡 Tailor & Dressmaker Management API                   ║
║                                                            ║
║   Server running on port ${PORT}                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                            ║
║   API: http://localhost:${PORT}/api/v1                    ║
║   Health: http://localhost:${PORT}/api/v1/health          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
        });

        // Graceful shutdown
        const gracefulShutdown = () => {
            console.log('\n🛑 Received shutdown signal. Closing server gracefully...');
            server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                console.error('⚠️  Forced shutdown');
                process.exit(1);
            }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
