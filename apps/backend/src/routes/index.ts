import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import accountsRouter from './accounts.js';
import categoriesRouter from './categories.js';
import budgetsRouter from './budgets.js';
import transactionsRouter from './transactions.js';
import reportsRouter from './reports.js';
import importRouter from './import.js';
import { apiRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

/**
 * Main API router
 * Mounts all route modules
 */

// Root endpoint - API information
router.get('/', (_req, res) => {
  res.json({
    name: 'MyBudget API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      accounts: '/api/v1/accounts',
      categories: '/api/v1/categories',
      budgets: '/api/v1/budgets',
      transactions: '/api/v1/transactions',
      reports: '/api/v1/reports',
      dashboard: '/api/v1/dashboard',
      import: '/api/v1/import',
    },
    documentation: 'See /health for server status',
  });
});

// Health check endpoint (no /api prefix needed, no rate limiting)
router.use('/health', healthRouter);

// Auth routes (have their own stricter rate limiting)
router.use('/api/v1/auth', authRouter);

// Protected API routes with general rate limiting (100 req/min per user)
router.use('/api/v1/accounts', apiRateLimiter, accountsRouter);
router.use('/api/v1/categories', apiRateLimiter, categoriesRouter);
router.use('/api/v1/budgets', apiRateLimiter, budgetsRouter);
router.use('/api/v1/transactions', apiRateLimiter, transactionsRouter);
router.use('/api/v1/reports', apiRateLimiter, reportsRouter);
router.use('/api/v1/dashboard', apiRateLimiter, reportsRouter);
router.use('/api/v1/import', apiRateLimiter, importRouter);
// router.use('/api/v1/users', apiRateLimiter, usersRouter);

export default router;
