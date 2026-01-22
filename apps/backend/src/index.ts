import { createApp } from './app.js';
import { config, validateConfig } from './config/index.js';

/**
 * Main application entry point
 * Validates configuration and starts the server
 */
async function main(): Promise<void> {
  try {
    // Validate configuration
    console.log('Validating configuration...');
    validateConfig();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.server.port, () => {
      console.log('='.repeat(50));
      console.log('MyBudget Backend Server');
      console.log('='.repeat(50));
      console.log(`Environment: ${config.server.env}`);
      console.log(`Port: ${config.server.port}`);
      console.log(
        `Health check: http://localhost:${config.server.port}/health`
      );
      console.log('='.repeat(50));
    });

    // Graceful shutdown handler
    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error: Error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: unknown) => {
      console.error('Unhandled Rejection:', reason);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
main();
