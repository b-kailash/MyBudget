import { Router, Request, Response } from 'express';
import { ApiResponse } from '@mybudget/shared';

const router = Router();

/**
 * Health check response interface
 */
interface HealthCheckData {
  status: 'ok';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

/**
 * GET /health
 * Health check endpoint
 * Returns server health status
 */
router.get('/', (_req: Request, res: Response) => {
  const response: ApiResponse<HealthCheckData> = {
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '0.0.1',
    },
    error: null,
  };

  res.status(200).json(response);
});

export default router;
