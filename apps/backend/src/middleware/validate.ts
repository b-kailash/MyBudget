import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '@mybudget/shared';

/**
 * Express middleware for validating request body against a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate and parse the request body
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.errors.map((err) => ({
              path: err.path.join('.'),
              message: err.message,
            })),
          },
        };
        res.status(400).json(response);
      } else {
        // Handle unexpected errors
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred during validation',
          },
        };
        res.status(500).json(response);
      }
    }
  };
}
