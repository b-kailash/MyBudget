import morgan from 'morgan';
import { config } from '../config/index.js';

/**
 * Request logging middleware using morgan
 * Uses different formats for development and production
 */
export const requestLogger = morgan(
  config.server.isDevelopment
    ? 'dev' // Colored, concise output for development
    : 'combined' // Standard Apache combined log format for production
);
