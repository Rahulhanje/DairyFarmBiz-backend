import app from './app';
import { config } from './config';
import { connectDB } from './config/db';
import { cronJobService } from './utils/cronJobs';

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize cron jobs
    cronJobService.initialize();

    // Start Express server - listen on all interfaces (0.0.0.0) for mobile access
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${config.port}`);
      console.log(`📡 Health check: http://localhost:${config.port}/health`);
      console.log(`📱 Mobile access: http://<your-ip>:${config.port}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  console.error('Unhandled Rejection:', reason.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error.message);
  process.exit(1);
});

startServer();
