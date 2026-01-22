import { z } from 'zod';
import {
  UserRole,
  UserStatus,
  AccountType,
  TransactionType,
  CategoryType,
  BudgetPeriod,
} from '../types/enums';
import {
  uuidSchema,
  currencySchema,
  hexColorSchema,
  isoDateSchema,
  positiveNumberSchema,
} from './common';

// ============================================================================
// Account Schemas
// ============================================================================

/**
 * Create account validation schema
 */
export const createAccountSchema = z.object({
  /** Account name */
  name: z
    .string()
    .min(1, 'Account name is required')
    .max(100, 'Account name is too long'),
  /** Account type */
  type: z.nativeEnum(AccountType, {
    errorMap: () => ({ message: 'Invalid account type' }),
  }),
  /** Currency code (ISO 4217) */
  currency: currencySchema,
  /** Opening balance amount */
  openingBalance: z.number(),
  /** Whether account is active */
  isActive: z.boolean().default(true).optional(),
});

/**
 * Update account validation schema
 */
export const updateAccountSchema = z.object({
  /** Account name */
  name: z
    .string()
    .min(1, 'Account name is required')
    .max(100, 'Account name is too long')
    .optional(),
  /** Account type */
  type: z
    .nativeEnum(AccountType, {
      errorMap: () => ({ message: 'Invalid account type' }),
    })
    .optional(),
  /** Currency code (ISO 4217) */
  currency: currencySchema.optional(),
  /** Opening balance amount */
  openingBalance: z.number().optional(),
  /** Whether account is active */
  isActive: z.boolean().optional(),
});

// ============================================================================
// Category Schemas
// ============================================================================

/**
 * Create category validation schema
 */
export const createCategorySchema = z.object({
  /** Category name */
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name is too long'),
  /** Category type */
  type: z.nativeEnum(CategoryType, {
    errorMap: () => ({ message: 'Invalid category type' }),
  }),
  /** Parent category ID (for subcategories) */
  parentId: uuidSchema.nullable().optional(),
  /** Display color (hex code) */
  color: hexColorSchema,
  /** Icon identifier */
  icon: z
    .string()
    .min(1, 'Icon is required')
    .max(50, 'Icon identifier is too long'),
});

/**
 * Update category validation schema
 */
export const updateCategorySchema = z.object({
  /** Category name */
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name is too long')
    .optional(),
  /** Category type */
  type: z
    .nativeEnum(CategoryType, {
      errorMap: () => ({ message: 'Invalid category type' }),
    })
    .optional(),
  /** Parent category ID (for subcategories) */
  parentId: uuidSchema.nullable().optional(),
  /** Display color (hex code) */
  color: hexColorSchema.optional(),
  /** Icon identifier */
  icon: z
    .string()
    .min(1, 'Icon is required')
    .max(50, 'Icon identifier is too long')
    .optional(),
});

// ============================================================================
// Transaction Schemas
// ============================================================================

/**
 * Create transaction validation schema
 */
export const createTransactionSchema = z
  .object({
    /** Source account ID */
    accountId: uuidSchema,
    /** Transaction category ID */
    categoryId: uuidSchema,
    /** Transaction type */
    type: z.nativeEnum(TransactionType, {
      errorMap: () => ({ message: 'Invalid transaction type' }),
    }),
    /** Transaction amount */
    amount: positiveNumberSchema,
    /** Currency code (ISO 4217) */
    currency: currencySchema,
    /** Transaction date (ISO 8601 string) */
    date: isoDateSchema,
    /** Payee or description */
    payee: z.string().min(1, 'Payee is required').max(200, 'Payee is too long'),
    /** Additional notes */
    notes: z.string().max(1000, 'Notes are too long').default('').optional(),
    /** Destination account ID (for transfers) */
    transferAccountId: uuidSchema.nullable().optional(),
  })
  .refine(
    (data) => {
      // If transaction type is TRANSFER, transferAccountId must be provided
      if (data.type === TransactionType.TRANSFER) {
        return data.transferAccountId != null;
      }
      return true;
    },
    {
      message: 'Transfer account ID is required for transfer transactions',
      path: ['transferAccountId'],
    }
  );

/**
 * Update transaction validation schema
 */
export const updateTransactionSchema = z.object({
  /** Source account ID */
  accountId: uuidSchema.optional(),
  /** Transaction category ID */
  categoryId: uuidSchema.optional(),
  /** Transaction type */
  type: z
    .nativeEnum(TransactionType, {
      errorMap: () => ({ message: 'Invalid transaction type' }),
    })
    .optional(),
  /** Transaction amount */
  amount: positiveNumberSchema.optional(),
  /** Currency code (ISO 4217) */
  currency: currencySchema.optional(),
  /** Transaction date (ISO 8601 string) */
  date: isoDateSchema.optional(),
  /** Payee or description */
  payee: z
    .string()
    .min(1, 'Payee is required')
    .max(200, 'Payee is too long')
    .optional(),
  /** Additional notes */
  notes: z.string().max(1000, 'Notes are too long').optional(),
  /** Destination account ID (for transfers) */
  transferAccountId: uuidSchema.nullable().optional(),
});

// ============================================================================
// Budget Schemas
// ============================================================================

/**
 * Create budget validation schema
 */
export const createBudgetSchema = z
  .object({
    /** Target category ID */
    categoryId: uuidSchema,
    /** Optional target account ID */
    accountId: uuidSchema.nullable().optional(),
    /** Budget period type */
    periodType: z.nativeEnum(BudgetPeriod, {
      errorMap: () => ({ message: 'Invalid budget period' }),
    }),
    /** Budget amount */
    amount: positiveNumberSchema,
    /** Period start date (ISO 8601 string) */
    startDate: isoDateSchema,
    /** Period end date (ISO 8601 string) */
    endDate: isoDateSchema,
  })
  .refine(
    (data) => {
      // Ensure end date is after start date
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

/**
 * Update budget validation schema
 */
export const updateBudgetSchema = z.object({
  /** Target category ID */
  categoryId: uuidSchema.optional(),
  /** Optional target account ID */
  accountId: uuidSchema.nullable().optional(),
  /** Budget period type */
  periodType: z
    .nativeEnum(BudgetPeriod, {
      errorMap: () => ({ message: 'Invalid budget period' }),
    })
    .optional(),
  /** Budget amount */
  amount: positiveNumberSchema.optional(),
  /** Period start date (ISO 8601 string) */
  startDate: isoDateSchema.optional(),
  /** Period end date (ISO 8601 string) */
  endDate: isoDateSchema.optional(),
});

// ============================================================================
// User Schemas
// ============================================================================

/**
 * Create user validation schema (invite member)
 */
export const createUserSchema = z.object({
  /** User email address */
  email: z.string().email('Invalid email address').toLowerCase(),
  /** User display name */
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  /** User role within family */
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Invalid user role' }),
  }),
});

/**
 * Update user validation schema
 */
export const updateUserSchema = z.object({
  /** User display name */
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .optional(),
  /** User role within family */
  role: z
    .nativeEnum(UserRole, {
      errorMap: () => ({ message: 'Invalid user role' }),
    })
    .optional(),
  /** User account status */
  status: z
    .nativeEnum(UserStatus, {
      errorMap: () => ({ message: 'Invalid user status' }),
    })
    .optional(),
});
