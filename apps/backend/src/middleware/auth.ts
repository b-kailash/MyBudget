import { Request, Response, NextFunction } from 'express';
import { UserRole, ApiResponse } from '@mybudget/shared';
import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Authentication middleware
 * Extracts and verifies JWT from Authorization header
 * Attaches user information to the request object
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      };
      res.status(401).json(response);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token
    const payload = verifyAccessToken(token);

    if (!payload) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token',
        },
      };
      res.status(401).json(response);
      return;
    }

    // Attach user information to request
    req.user = {
      userId: payload.userId,
      familyId: payload.familyId,
      role: payload.role as UserRole,
    };

    next();
  } catch (error) {
    const response: ApiResponse<null> = {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during authentication',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Role-based authorization middleware factory
 * Checks if authenticated user has one of the required roles
 * @param roles - Array of allowed roles
 * @returns Express middleware function
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Ensure user is authenticated
    if (!req.user) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };
      res.status(401).json(response);
      return;
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
}
