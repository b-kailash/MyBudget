import { z } from 'zod';

/**
 * UUID v4 validation schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase();

/**
 * Password validation schema
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must not exceed 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Currency code validation schema (ISO 4217)
 */
export const currencySchema = z
  .string()
  .length(3, 'Currency code must be 3 characters')
  .toUpperCase();

/**
 * Hex color validation schema
 */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format');

/**
 * ISO date string validation schema
 */
export const isoDateSchema = z.string().datetime('Invalid ISO date format');

/**
 * Pagination parameters schema
 */
export const paginationSchema = z.object({
  /** Page number (1-indexed, default: 1) */
  page: z.coerce.number().int().min(1).default(1).optional(),
  /** Items per page (default: 20, max: 100) */
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  /** Sort field */
  sortBy: z.string().optional(),
  /** Sort direction */
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Positive number validation schema
 */
export const positiveNumberSchema = z
  .number()
  .positive('Must be a positive number');

/**
 * Non-negative number validation schema
 */
export const nonNegativeNumberSchema = z
  .number()
  .nonnegative('Must be a non-negative number');
