import { z } from 'zod';
import { emailSchema, passwordSchema } from './common';

/**
 * User registration validation schema
 */
export const registerSchema = z.object({
  /** User email address */
  email: emailSchema,
  /** User password */
  password: passwordSchema,
  /** User display name */
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  /** Family name */
  familyName: z
    .string()
    .min(1, 'Family name is required')
    .max(100, 'Family name is too long'),
});

/**
 * User login validation schema
 */
export const loginSchema = z.object({
  /** User email address */
  email: emailSchema,
  /** User password */
  password: z.string().min(1, 'Password is required'),
});

/**
 * Token refresh validation schema
 */
export const refreshTokenSchema = z.object({
  /** Refresh token */
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Forgot password request validation schema
 */
export const forgotPasswordSchema = z.object({
  /** User email address */
  email: emailSchema,
});

/**
 * Password reset validation schema
 */
export const resetPasswordSchema = z.object({
  /** Password reset token */
  token: z.string().min(1, 'Reset token is required'),
  /** New password */
  password: passwordSchema,
});

/**
 * Change password validation schema (for authenticated users)
 */
export const changePasswordSchema = z.object({
  /** Current password */
  currentPassword: z.string().min(1, 'Current password is required'),
  /** New password */
  newPassword: passwordSchema,
});
