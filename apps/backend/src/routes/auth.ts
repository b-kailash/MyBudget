import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  ApiResponse,
  LoginResponse,
  RefreshResponse,
  UserRole,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@mybudget/shared';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import {
  authRateLimiter,
  passwordResetRateLimiter,
} from '../middleware/rateLimit.js';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../utils/index.js';

// Account lockout configuration
const LOCKOUT_THRESHOLD = 5; // Number of failed attempts before lockout
const LOCKOUT_DURATION_MINUTES = 15; // Lockout duration in minutes
const FAILED_ATTEMPT_WINDOW_MINUTES = 15; // Window to count failed attempts

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user and create a family
 */
router.post(
  '/register',
  authRateLimiter,
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
 * Helper function to get client IP address
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Helper function to record login attempt
 */
async function recordLoginAttempt(
  email: string,
  ipAddress: string,
  success: boolean
): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      email,
      ipAddress,
      success,
    },
  });
}

/**
 * Helper function to check if account is locked
 */
async function isAccountLocked(email: string): Promise<boolean> {
  const windowStart = new Date();
  windowStart.setMinutes(
    windowStart.getMinutes() - FAILED_ATTEMPT_WINDOW_MINUTES
  );

  const failedAttempts = await prisma.loginAttempt.count({
    where: {
      email,
      success: false,
      createdAt: { gte: windowStart },
    },
  });

  return failedAttempts >= LOCKOUT_THRESHOLD;
}

/**
 * Helper function to get lockout remaining time
 */
async function getLockoutRemainingMinutes(email: string): Promise<number> {
  const lastFailedAttempt = await prisma.loginAttempt.findFirst({
    where: {
      email,
      success: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!lastFailedAttempt) return 0;

  const lockoutEnds = new Date(lastFailedAttempt.createdAt);
  lockoutEnds.setMinutes(lockoutEnds.getMinutes() + LOCKOUT_DURATION_MINUTES);

  const remainingMs = lockoutEnds.getTime() - Date.now();
  return Math.max(0, Math.ceil(remainingMs / 60000));
}

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const ipAddress = getClientIp(req);

      // Check if account is locked due to too many failed attempts
      const locked = await isAccountLocked(email);
      if (locked) {
        const remainingMinutes = await getLockoutRemainingMinutes(email);
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'ACCOUNT_LOCKED',
            message: `Account temporarily locked due to too many failed login attempts. Try again in ${remainingMinutes} minutes.`,
          },
        };
        res.status(429).json(response);
        return;
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Record failed attempt even for non-existent user (prevents user enumeration timing attacks)
        await recordLoginAttempt(email, ipAddress, false);
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
        // Record failed attempt
        await recordLoginAttempt(email, ipAddress, false);
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

      // Record successful attempt (resets the lockout window)
      await recordLoginAttempt(email, ipAddress, true);

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
  authRateLimiter,
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

/**
 * POST /api/v1/auth/forgot-password
 * Request a password reset token
 */
router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validate(forgotPasswordSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Always return success to prevent email enumeration attacks
      const successResponse: ApiResponse<{ message: string }> = {
        data: {
          message:
            'If an account with that email exists, a password reset link has been sent.',
        },
        error: null,
      };

      if (!user || user.isDeleted || user.status === 'DISABLED') {
        // Return success even if user doesn't exist (security measure)
        res.status(200).json(successResponse);
        return;
      }

      // Generate a secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Token expires in 1 hour
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Invalidate any existing reset tokens for this user
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(), // Mark as used to invalidate
        },
      });

      // Create new reset token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      // TODO: Send email with reset link containing resetToken
      // For now, log the token (in production, this would be sent via email)
      console.log(
        `Password reset token for ${email}: ${resetToken} (expires: ${expiresAt.toISOString()})`
      );

      res.status(200).json(successResponse);
    } catch (error) {
      console.error('Forgot password error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while processing your request',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/v1/auth/reset-password
 * Reset password using reset token
 */
router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validate(resetPasswordSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, password } = req.body;

      // Hash the provided token to compare with stored hash
      const tokenHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find the reset token
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (!resetToken) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired reset token',
          },
        };
        res.status(400).json(response);
        return;
      }

      // Check if user account is still valid
      if (resetToken.user.isDeleted || resetToken.user.status === 'DISABLED') {
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

      // Hash the new password
      const passwordHash = await hashPassword(password);

      // Update password and invalidate all tokens in a transaction
      await prisma.$transaction([
        // Update user password
        prisma.user.update({
          where: { id: resetToken.userId },
          data: { passwordHash },
        }),
        // Mark reset token as used
        prisma.passwordResetToken.update({
          where: { id: resetToken.id },
          data: { usedAt: new Date() },
        }),
        // Revoke all refresh tokens (security measure - force re-login)
        prisma.refreshToken.updateMany({
          where: {
            userId: resetToken.userId,
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        }),
      ]);

      const response: ApiResponse<{ message: string }> = {
        data: {
          message:
            'Password has been reset successfully. Please login with your new password.',
        },
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Reset password error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while resetting your password',
        },
      };
      res.status(500).json(response);
    }
  }
);

export default router;
