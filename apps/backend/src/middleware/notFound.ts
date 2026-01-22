import { Request, Response } from 'express';
import { ApiResponse } from '@mybudget/shared';

/**
 * 404 Not Found handler for unknown routes
 * This should be the last middleware in the chain (before error handler)
 */
export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse<null> = {
    data: null,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
      details: {
        method: req.method,
        path: req.path,
      },
    },
  };

  res.status(404).json(response);
}
