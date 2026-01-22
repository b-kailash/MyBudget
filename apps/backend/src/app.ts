import express, { Application } from 'express';
import helmet from 'helmet';
import {
  corsMiddleware,
  requestLogger,
  errorHandler,
  notFoundHandler,
} from './middleware/index.js';
import router from './routes/index.js';

/**
 * Creates and configures the Express application
 * @returns Configured Express application
 */
export function createApp(): Application {
  const app = express();

  // =========================================================================
  // Security & Parsing Middleware
  // =========================================================================

  // Security headers
  app.use(helmet());

  // CORS
  app.use(corsMiddleware);

  // Request logging
  app.use(requestLogger);

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // =========================================================================
  // Routes
  // =========================================================================

  // Mount all routes
  app.use('/', router);

  // =========================================================================
  // Error Handling
  // =========================================================================

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
