import { Router } from 'express';
import healthRouter from './health.js';

const router = Router();

/**
 * Main API router
 * Mounts all route modules
 */

// Health check endpoint (no /api prefix needed)
router.use('/health', healthRouter);

// API routes will be mounted here in future phases
// router.use('/api/auth', authRouter);
// router.use('/api/users', usersRouter);
// router.use('/api/accounts', accountsRouter);
// router.use('/api/categories', categoriesRouter);
// router.use('/api/transactions', transactionsRouter);
// router.use('/api/budgets', budgetsRouter);

export default router;
