import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import accountsRouter from './accounts.js';
import categoriesRouter from './categories.js';
import budgetsRouter from './budgets.js';
import transactionsRouter from './transactions.js';

const router = Router();

/**
 * Main API router
 * Mounts all route modules
 */

// Health check endpoint (no /api prefix needed)
router.use('/health', healthRouter);

// API routes
router.use('/api/v1/auth', authRouter);
router.use('/api/v1/accounts', accountsRouter);
router.use('/api/v1/categories', categoriesRouter);
router.use('/api/v1/budgets', budgetsRouter);
router.use('/api/v1/transactions', transactionsRouter);
// router.use('/api/v1/users', usersRouter);

export default router;
