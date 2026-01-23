import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import accountsRouter from './accounts.js';
import categoriesRouter from './categories.js';
import budgetsRouter from './budgets.js';
import transactionsRouter from './transactions.js';
import { apiRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

/**
 * Main API router
 * Mounts all route modules
 */

// Health check endpoint (no /api prefix needed, no rate limiting)
router.use('/health', healthRouter);

// Auth routes (have their own stricter rate limiting)
router.use('/api/v1/auth', authRouter);

// Protected API routes with general rate limiting (100 req/min per user)
router.use('/api/v1/accounts', apiRateLimiter, accountsRouter);
router.use('/api/v1/categories', apiRateLimiter, categoriesRouter);
router.use('/api/v1/budgets', apiRateLimiter, budgetsRouter);
router.use('/api/v1/transactions', apiRateLimiter, transactionsRouter);
// router.use('/api/v1/users', apiRateLimiter, usersRouter);

export default router;
