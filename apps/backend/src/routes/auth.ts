import { Router, Request, Response } from 'express';
import {
  ApiResponse,
  LoginResponse,
  RefreshResponse,
  UserRole,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '@mybudget/shared';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../utils/index.js';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user and create a family
 */
router.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name, familyName } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'USER_EXISTS',
            message: 'A user with this email already exists',
          },
        };
        res.status(409).json(response);
        return;
      }

      // Hash the password
      const passwordHash = await hashPassword(password);

      // Create family and user in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the family
        const family = await tx.family.create({
          data: {
            name: familyName,
          },
        });

        // Create the user as FAMILY_ADMIN
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            name,
            familyId: family.id,
            role: 'FAMILY_ADMIN',
            status: 'ACTIVE',
          },
        });

        return { family, user };
      });

      // Generate tokens
      const accessToken = generateAccessToken(
        result.user.id,
        result.user.familyId,
        result.user.role
      );
      const refreshToken = generateRefreshToken();
      const refreshTokenHash = hashRefreshToken(refreshToken);

      // Store refresh token in database
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      await prisma.refreshToken.create({
        data: {
          userId: result.user.id,
          tokenHash: refreshTokenHash,
          expiresAt,
        },
      });

      // Return response
      const responseData: LoginResponse = {
        accessToken,
        refreshToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          familyId: result.user.familyId,
          role: result.user.role as UserRole,
        },
      };

      const response: ApiResponse<LoginResponse> = {
        data: responseData,
        error: null,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Registration error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during registration',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        };
        res.status(401).json(response);
        return;
      }

      // Check if user is deleted or disabled
      if (user.isDeleted || user.status === 'DISABLED') {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'This account has been disabled',
          },
        };
        res.status(403).json(response);
        return;
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        };
        res.status(401).json(response);
        return;
      }

      // Generate tokens
      const accessToken = generateAccessToken(
        user.id,
        user.familyId,
        user.role
      );
      const refreshToken = generateRefreshToken();
      const refreshTokenHash = hashRefreshToken(refreshToken);

      // Store refresh token in database
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: refreshTokenHash,
          expiresAt,
        },
      });

      // Return response
      const responseData: LoginResponse = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          familyId: user.familyId,
          role: user.role as UserRole,
        },
      };

      const response: ApiResponse<LoginResponse> = {
        data: responseData,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Login error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during login',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/v1/auth/logout
 * Logout and revoke refresh token
 */
router.post(
  '/logout',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Refresh token is required',
          },
        };
        res.status(400).json(response);
        return;
      }

      // Hash the refresh token to find it in database
      const tokenHash = hashRefreshToken(refreshToken);

      // Find and revoke the refresh token
      const token = await prisma.refreshToken.findFirst({
        where: {
          tokenHash,
          userId: req.user!.userId,
        },
      });

      if (token) {
        await prisma.refreshToken.update({
          where: { id: token.id },
          data: { revokedAt: new Date() },
        });
      }

      const response: ApiResponse<{ message: string }> = {
        data: { message: 'Logout successful' },
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Logout error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during logout',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      // Hash the refresh token to find it in database
      const tokenHash = hashRefreshToken(refreshToken);

      // Find the refresh token
      const storedToken = await prisma.refreshToken.findFirst({
        where: { tokenHash },
        include: { user: true },
      });

      if (!storedToken) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid refresh token',
          },
        };
        res.status(401).json(response);
        return;
      }

      // Check if token is revoked
      if (storedToken.revokedAt) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'TOKEN_REVOKED',
            message: 'Refresh token has been revoked',
          },
        };
        res.status(401).json(response);
        return;
      }

      // Check if token is expired
      if (new Date() > storedToken.expiresAt) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Refresh token has expired',
          },
        };
        res.status(401).json(response);
        return;
      }

      // Check if user is active
      if (
        storedToken.user.isDeleted ||
        storedToken.user.status === 'DISABLED'
      ) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'This account has been disabled',
          },
        };
        res.status(403).json(response);
        return;
      }

      // Generate new access token
      const accessToken = generateAccessToken(
        storedToken.user.id,
        storedToken.user.familyId,
        storedToken.user.role
      );

      // Optionally rotate refresh token (create new one and revoke old one)
      const newRefreshToken = generateRefreshToken();
      const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

      // Create new refresh token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      await prisma.$transaction([
        // Revoke old token
        prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { revokedAt: new Date() },
        }),
        // Create new token
        prisma.refreshToken.create({
          data: {
            userId: storedToken.user.id,
            tokenHash: newRefreshTokenHash,
            expiresAt,
          },
        }),
      ]);

      // Return response with new tokens
      const responseData: RefreshResponse = {
        accessToken,
        refreshToken: newRefreshToken,
      };

      const response: ApiResponse<RefreshResponse> = {
        data: responseData,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Token refresh error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during token refresh',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Fetch user from database (without password hash)
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          email: true,
          name: true,
          familyId: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          isDeleted: true,
        },
      });

      if (!user) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof user> = {
        data: user,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Get user profile error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching user profile',
        },
      };
      res.status(500).json(response);
    }
  }
);

export default router;
