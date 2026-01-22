import cors from 'cors';
import { config } from '../config/index.js';

/**
 * CORS middleware configuration
 * Allows requests from configured origins
 */
export const corsMiddleware = cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
});
