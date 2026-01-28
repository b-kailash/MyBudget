import { z } from 'zod';
import { uuidSchema, isoDateSchema } from './common';
import {
  createAccountSchema,
  updateAccountSchema,
  createCategorySchema,
  updateCategorySchema,
  createTransactionSchema,
  updateTransactionSchema,
  createBudgetSchema,
  updateBudgetSchema,
} from './entities';

// ============================================================================
// Sync Operation Schemas
// ============================================================================

/**
 * Sync operation type schema
 */
export const syncOperationSchema = z.enum(['CREATE', 'UPDATE', 'DELETE']);

/**
 * Sync entity type schema
 */
export const syncEntityTypeSchema = z.enum([
  'account',
  'category',
  'transaction',
  'budget',
]);

// ============================================================================
// Sync Change Schemas (per entity type and operation)
// ============================================================================

/**
 * Base sync change fields
 */
const baseSyncChangeSchema = z.object({
  /** Entity ID (client-generated UUID for CREATE) */
  id: uuidSchema,
  /** Client's version of the entity (0 for CREATE) */
  clientVersion: z.number().int().nonnegative(),
  /** Client timestamp when change was made */
  clientTimestamp: isoDateSchema,
});

/**
 * Account sync change schema
 */
export const accountSyncChangeSchema = z.discriminatedUnion('operation', [
  baseSyncChangeSchema.extend({
    entityType: z.literal('account'),
    operation: z.literal('CREATE'),
    data: createAccountSchema,
  }),
  baseSyncChangeSchema.extend({
    entityType: z.literal('account'),
    operation: z.literal('UPDATE'),
    data: updateAccountSchema,
  }),
  baseSyncChangeSchema.extend({
    entityType: z.literal('account'),
    operation: z.literal('DELETE'),
    data: z.null(),
  }),
]);

/**
 * Category sync change schema
 */
export const categorySyncChangeSchema = z.discriminatedUnion('operation', [
  baseSyncChangeSchema.extend({
    entityType: z.literal('category'),
    operation: z.literal('CREATE'),
    data: createCategorySchema,
  }),
  baseSyncChangeSchema.extend({
    entityType: z.literal('category'),
    operation: z.literal('UPDATE'),
    data: updateCategorySchema,
  }),
  baseSyncChangeSchema.extend({
    entityType: z.literal('category'),
    operation: z.literal('DELETE'),
    data: z.null(),
  }),
]);

/**
 * Transaction sync change schema - uses base schemas without refinements for sync
 */
const transactionSyncDataSchema = z.object({
  accountId: uuidSchema,
  categoryId: uuidSchema,
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.number().positive(),
  currency: z.string().length(3).toUpperCase(),
  date: isoDateSchema,
  payee: z.string().min(1).max(200),
  notes: z.string().max(1000).default('').optional(),
  transferAccountId: uuidSchema.nullable().optional(),
});

const transactionSyncUpdateSchema = z.object({
  accountId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  date: isoDateSchema.optional(),
  payee: z.string().min(1).max(200).optional(),
  notes: z.string().max(1000).optional(),
  transferAccountId: uuidSchema.nullable().optional(),
});

export const transactionSyncChangeSchema = z.discriminatedUnion('operation', [
  baseSyncChangeSchema.extend({
    entityType: z.literal('transaction'),
    operation: z.literal('CREATE'),
    data: transactionSyncDataSchema,
  }),
  baseSyncChangeSchema.extend({
    entityType: z.literal('transaction'),
    operation: z.literal('UPDATE'),
    data: transactionSyncUpdateSchema,
  }),
  baseSyncChangeSchema.extend({
    entityType: z.literal('transaction'),
    operation: z.literal('DELETE'),
    data: z.null(),
  }),
]);

/**
 * Budget sync change schema - uses base schemas without refinements for sync
 */
const budgetSyncDataSchema = z.object({
  categoryId: uuidSchema,
  accountId: uuidSchema.nullable().optional(),
  periodType: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  amount: z.number().positive(),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
});

const budgetSyncUpdateSchema = z.object({
  categoryId: uuidSchema.optional(),
  accountId: uuidSchema.nullable().optional(),
  periodType: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  amount: z.number().positive().optional(),
  startDate: isoDateSchema.optional(),
  endDate: isoDateSchema.optional(),
});

export const budgetSyncChangeSchema = z.discriminatedUnion('operation', [
  baseSyncChangeSchema.extend({
    entityType: z.literal('budget'),
    operation: z.literal('CREATE'),
    data: budgetSyncDataSchema,
  }),
  baseSyncChangeSchema.extend({
    entityType: z.literal('budget'),
    operation: z.literal('UPDATE'),
    data: budgetSyncUpdateSchema,
  }),
  baseSyncChangeSchema.extend({
    entityType: z.literal('budget'),
    operation: z.literal('DELETE'),
    data: z.null(),
  }),
]);

// ============================================================================
// Sync Request Schema
// ============================================================================

/**
 * Sync request validation schema
 */
export const syncRequestSchema = z
  .object({
    /** Last successful sync timestamp (null for initial sync) */
    lastSyncTimestamp: isoDateSchema.nullable(),
    /** Changes to push to server, grouped by entity type */
    changes: z.object({
      accounts: z.array(accountSyncChangeSchema).max(250).optional(),
      categories: z.array(categorySyncChangeSchema).max(250).optional(),
      transactions: z.array(transactionSyncChangeSchema).max(250).optional(),
      budgets: z.array(budgetSyncChangeSchema).max(250).optional(),
    }),
    /** Client device identifier for debugging */
    clientId: z.string().max(100).optional(),
  })
  .refine(
    (data) => {
      // Ensure total changes don't exceed 1000
      const totalChanges =
        (data.changes.accounts?.length || 0) +
        (data.changes.categories?.length || 0) +
        (data.changes.transactions?.length || 0) +
        (data.changes.budgets?.length || 0);
      return totalChanges <= 1000;
    },
    {
      message: 'Total changes cannot exceed 1000 per sync request',
      path: ['changes'],
    }
  );

// ============================================================================
// Type Exports
// ============================================================================

export type SyncRequestInput = z.infer<typeof syncRequestSchema>;
export type AccountSyncChange = z.infer<typeof accountSyncChangeSchema>;
export type CategorySyncChange = z.infer<typeof categorySyncChangeSchema>;
export type TransactionSyncChange = z.infer<typeof transactionSyncChangeSchema>;
export type BudgetSyncChange = z.infer<typeof budgetSyncChangeSchema>;
