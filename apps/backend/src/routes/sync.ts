import { Router, Request, Response } from 'express';
import {
  ApiResponse,
  SyncResponse,
  SyncPushResult,
  SyncConflict,
  SyncPullData,
  syncRequestSchema,
  SyncRequestInput,
} from '@mybudget/shared';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

const router = Router();

// Types for sync change processing
type SyncChangeAny = {
  id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  clientVersion: number;
  clientTimestamp: string;
  data: any;
};

/**
 * Process account changes
 */
async function processAccountChanges(
  tx: Prisma.TransactionClient,
  familyId: string,
  changes: SyncChangeAny[]
): Promise<{ results: SyncPushResult[]; conflicts: SyncConflict[] }> {
  const results: SyncPushResult[] = [];
  const conflicts: SyncConflict[] = [];

  for (const change of changes) {
    try {
      if (change.operation === 'CREATE') {
        // Check if entity already exists (idempotency)
        const existing = await tx.account.findFirst({
          where: { id: change.id, familyId },
        });

        if (existing) {
          if (existing.version === 1) {
            // Duplicate create, return success
            results.push({ id: change.id, success: true, newVersion: 1 });
          } else {
            // Entity exists with higher version - conflict
            conflicts.push({
              entityType: 'account',
              id: change.id,
              clientVersion: change.clientVersion,
              serverVersion: existing.version,
              serverEntity: existing as any,
            });
            results.push({
              id: change.id,
              success: false,
              errorCode: 'CONFLICT',
              serverEntity: existing,
            });
          }
          continue;
        }

        // Create new entity
        const created = await tx.account.create({
          data: {
            id: change.id,
            familyId,
            name: change.data.name,
            type: change.data.type,
            currency: change.data.currency,
            openingBalance: change.data.openingBalance,
            isActive: change.data.isActive ?? true,
            version: 1,
          },
        });
        results.push({ id: change.id, success: true, newVersion: created.version });
      } else if (change.operation === 'UPDATE') {
        const existing = await tx.account.findFirst({
          where: { id: change.id, familyId, isDeleted: false },
        });

        if (!existing) {
          results.push({
            id: change.id,
            success: false,
            errorCode: 'NOT_FOUND',
            errorMessage: 'Account not found',
          });
          continue;
        }

        if (existing.version !== change.clientVersion) {
          conflicts.push({
            entityType: 'account',
            id: change.id,
            clientVersion: change.clientVersion,
            serverVersion: existing.version,
            serverEntity: existing as any,
          });
          results.push({
            id: change.id,
            success: false,
            errorCode: 'CONFLICT',
            serverEntity: existing,
          });
          continue;
        }

        const updated = await tx.account.update({
          where: { id: change.id },
          data: {
            ...change.data,
            version: { increment: 1 },
            updatedAt: new Date(),
          },
        });
        results.push({ id: change.id, success: true, newVersion: updated.version });
      } else if (change.operation === 'DELETE') {
        const existing = await tx.account.findFirst({
          where: { id: change.id, familyId, isDeleted: false },
        });

        if (!existing) {
          // Already deleted or doesn't exist - idempotent success
          results.push({ id: change.id, success: true });
          continue;
        }

        if (existing.version !== change.clientVersion) {
          conflicts.push({
            entityType: 'account',
            id: change.id,
            clientVersion: change.clientVersion,
            serverVersion: existing.version,
            serverEntity: existing as any,
          });
          results.push({
            id: change.id,
            success: false,
            errorCode: 'CONFLICT',
            serverEntity: existing,
          });
          continue;
        }

        const deleted = await tx.account.update({
          where: { id: change.id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            version: { increment: 1 },
            updatedAt: new Date(),
          },
        });
        results.push({ id: change.id, success: true, newVersion: deleted.version });
      }
    } catch (error) {
      results.push({
        id: change.id,
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { results, conflicts };
}

/**
 * Process category changes
 */
async function processCategoryChanges(
  tx: Prisma.TransactionClient,
  familyId: string,
  changes: SyncChangeAny[]
): Promise<{ results: SyncPushResult[]; conflicts: SyncConflict[] }> {
  const results: SyncPushResult[] = [];
  const conflicts: SyncConflict[] = [];

  for (const change of changes) {
    try {
      if (change.operation === 'CREATE') {
        const existing = await tx.category.findFirst({
          where: { id: change.id, familyId },
        });

        if (existing) {
          if (existing.version === 1) {
            results.push({ id: change.id, success: true, newVersion: 1 });
          } else {
            conflicts.push({
              entityType: 'category',
              id: change.id,
              clientVersion: change.clientVersion,
              serverVersion: existing.version,
              serverEntity: existing as any,
            });
            results.push({
              id: change.id,
              success: false,
              errorCode: 'CONFLICT',
              serverEntity: existing,
            });
          }
          continue;
        }

        const created = await tx.category.create({
          data: {
            id: change.id,
            familyId,
            name: change.data.name,
            type: change.data.type,
            parentId: change.data.parentId || null,
            color: change.data.color,
            icon: change.data.icon,
            version: 1,
          },
        });
        results.push({ id: change.id, success: true, newVersion: created.version });
      } else if (change.operation === 'UPDATE') {
        const existing = await tx.category.findFirst({
          where: { id: change.id, familyId, isDeleted: false },
        });

        if (!existing) {
          results.push({
            id: change.id,
            success: false,
            errorCode: 'NOT_FOUND',
            errorMessage: 'Category not found',
          });
          continue;
        }

        if (existing.version !== change.clientVersion) {
          conflicts.push({
            entityType: 'category',
            id: change.id,
            clientVersion: change.clientVersion,
            serverVersion: existing.version,
            serverEntity: existing as any,
          });
          results.push({
            id: change.id,
            success: false,
            errorCode: 'CONFLICT',
            serverEntity: existing,
          });
          continue;
        }

        const updated = await tx.category.update({
          where: { id: change.id },
          data: {
            ...change.data,
            version: { increment: 1 },
            updatedAt: new Date(),
          },
        });
        results.push({ id: change.id, success: true, newVersion: updated.version });
      } else if (change.operation === 'DELETE') {
        const existing = await tx.category.findFirst({
          where: { id: change.id, familyId, isDeleted: false },
        });

        if (!existing) {
          results.push({ id: change.id, success: true });
          continue;
        }

        if (existing.version !== change.clientVersion) {
          conflicts.push({
            entityType: 'category',
            id: change.id,
            clientVersion: change.clientVersion,
            serverVersion: existing.version,
            serverEntity: existing as any,
          });
          results.push({
            id: change.id,
            success: false,
            errorCode: 'CONFLICT',
            serverEntity: existing,
          });
          continue;
        }

        const deleted = await tx.category.update({
          where: { id: change.id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            version: { increment: 1 },
            updatedAt: new Date(),
          },
        });
        results.push({ id: change.id, success: true, newVersion: deleted.version });
      }
    } catch (error) {
      results.push({
        id: change.id,
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { results, conflicts };
}

/**
 * Process budget changes
 */
async function processBudgetChanges(
  tx: Prisma.TransactionClient,
  familyId: string,
  changes: SyncChangeAny[]
): Promise<{ results: SyncPushResult[]; conflicts: SyncConflict[] }> {
  const results: SyncPushResult[] = [];
  const conflicts: SyncConflict[] = [];

  for (const change of changes) {
    try {
      if (change.operation === 'CREATE') {
        const existing = await tx.budget.findFirst({
          where: { id: change.id, familyId },
        });

        if (existing) {
          if (existing.version === 1) {
            results.push({ id: change.id, success: true, newVersion: 1 });
          } else {
            conflicts.push({
              entityType: 'budget',
              id: change.id,
              clientVersion: change.clientVersion,
              serverVersion: existing.version,
              serverEntity: existing as any,
            });
            results.push({
              id: change.id,
              success: false,
              errorCode: 'CONFLICT',
              serverEntity: existing,
            });
          }
          continue;
        }

        const created = await tx.budget.create({
          data: {
            id: change.id,
            familyId,
            categoryId: change.data.categoryId,
            accountId: change.data.accountId || null,
            periodType: change.data.periodType,
            amount: change.data.amount,
            startDate: new Date(change.data.startDate),
            endDate: new Date(change.data.endDate),
            version: 1,
          },
        });
        results.push({ id: change.id, success: true, newVersion: created.version });
      } else if (change.operation === 'UPDATE') {
        const existing = await tx.budget.findFirst({
          where: { id: change.id, familyId, isDeleted: false },
        });

        if (!existing) {
          results.push({
            id: change.id,
            success: false,
            errorCode: 'NOT_FOUND',
            errorMessage: 'Budget not found',
          });
          continue;
        }

        if (existing.version !== change.clientVersion) {
          conflicts.push({
            entityType: 'budget',
            id: change.id,
            clientVersion: change.clientVersion,
            serverVersion: existing.version,
            serverEntity: existing as any,
          });
          results.push({
            id: change.id,
            success: false,
            errorCode: 'CONFLICT',
            serverEntity: existing,
          });
          continue;
        }

        const updateData: any = { ...change.data };
        if (change.data.startDate) updateData.startDate = new Date(change.data.startDate);
        if (change.data.endDate) updateData.endDate = new Date(change.data.endDate);

        const updated = await tx.budget.update({
          where: { id: change.id },
          data: {
            ...updateData,
            version: { increment: 1 },
            updatedAt: new Date(),
          },
        });
        results.push({ id: change.id, success: true, newVersion: updated.version });
      } else if (change.operation === 'DELETE') {
        const existing = await tx.budget.findFirst({
          where: { id: change.id, familyId, isDeleted: false },
        });

        if (!existing) {
          results.push({ id: change.id, success: true });
          continue;
        }

        if (existing.version !== change.clientVersion) {
          conflicts.push({
            entityType: 'budget',
            id: change.id,
            clientVersion: change.clientVersion,
            serverVersion: existing.version,
            serverEntity: existing as any,
          });
          results.push({
            id: change.id,
            success: false,
            errorCode: 'CONFLICT',
            serverEntity: existing,
          });
          continue;
        }

        const deleted = await tx.budget.update({
          where: { id: change.id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            version: { increment: 1 },
            updatedAt: new Date(),
          },
        });
        results.push({ id: change.id, success: true, newVersion: deleted.version });
      }
    } catch (error) {
      results.push({
        id: change.id,
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { results, conflicts };
}

/**
 * Process transaction changes
 */
async function processTransactionChanges(
  tx: Prisma.TransactionClient,
  familyId: string,
  userId: string,
  changes: SyncChangeAny[]
): Promise<{ results: SyncPushResult[]; conflicts: SyncConflict[] }> {
  const results: SyncPushResult[] = [];
  const conflicts: SyncConflict[] = [];

  for (const change of changes) {
    try {
      if (change.operation === 'CREATE') {
        const existing = await tx.transaction.findFirst({
          where: { id: change.id, familyId },
        });

        if (existing) {
          if (existing.version === 1) {
            results.push({ id: change.id, success: true, newVersion: 1 });
          } else {
            conflicts.push({
              entityType: 'transaction',
              id: change.id,
              clientVersion: change.clientVersion,
              serverVersion: existing.version,
              serverEntity: existing as any,
            });
            results.push({
              id: change.id,
              success: false,
              errorCode: 'CONFLICT',
              serverEntity: existing,
            });
          }
          continue;
        }

        const created = await tx.transaction.create({
          data: {
            id: change.id,
            familyId,
            userId,
            accountId: change.data.accountId,
            categoryId: change.data.categoryId,
            type: change.data.type,
            amount: change.data.amount,
            currency: change.data.currency,
            date: new Date(change.data.date),
            payee: change.data.payee,
            notes: change.data.notes || '',
            transferAccountId: change.data.transferAccountId || null,
            version: 1,
          },
        });
        results.push({ id: change.id, success: true, newVersion: created.version });
      } else if (change.operation === 'UPDATE') {
        const existing = await tx.transaction.findFirst({
          where: { id: change.id, familyId, isDeleted: false },
        });

        if (!existing) {
          results.push({
            id: change.id,
            success: false,
            errorCode: 'NOT_FOUND',
            errorMessage: 'Transaction not found',
          });
          continue;
        }

        if (existing.version !== change.clientVersion) {
          conflicts.push({
            entityType: 'transaction',
            id: change.id,
            clientVersion: change.clientVersion,
            serverVersion: existing.version,
            serverEntity: existing as any,
          });
          results.push({
            id: change.id,
            success: false,
            errorCode: 'CONFLICT',
            serverEntity: existing,
          });
          continue;
        }

        const updateData: any = { ...change.data };
        if (change.data.date) updateData.date = new Date(change.data.date);

        const updated = await tx.transaction.update({
          where: { id: change.id },
          data: {
            ...updateData,
            version: { increment: 1 },
            updatedAt: new Date(),
          },
        });
        results.push({ id: change.id, success: true, newVersion: updated.version });
      } else if (change.operation === 'DELETE') {
        const existing = await tx.transaction.findFirst({
          where: { id: change.id, familyId, isDeleted: false },
        });

        if (!existing) {
          results.push({ id: change.id, success: true });
          continue;
        }

        if (existing.version !== change.clientVersion) {
          conflicts.push({
            entityType: 'transaction',
            id: change.id,
            clientVersion: change.clientVersion,
            serverVersion: existing.version,
            serverEntity: existing as any,
          });
          results.push({
            id: change.id,
            success: false,
            errorCode: 'CONFLICT',
            serverEntity: existing,
          });
          continue;
        }

        const deleted = await tx.transaction.update({
          where: { id: change.id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            version: { increment: 1 },
            updatedAt: new Date(),
          },
        });
        results.push({ id: change.id, success: true, newVersion: deleted.version });
      }
    } catch (error) {
      results.push({
        id: change.id,
        success: false,
        errorCode: 'VALIDATION_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { results, conflicts };
}

/**
 * Pull changed entities since lastSyncTimestamp
 */
async function pullChanges(
  tx: Prisma.TransactionClient,
  familyId: string,
  lastSyncTimestamp: Date | null
): Promise<SyncPullData> {
  const whereClause = lastSyncTimestamp
    ? { familyId, updatedAt: { gt: lastSyncTimestamp } }
    : { familyId };

  const [accounts, categories, transactions, budgets] = await Promise.all([
    tx.account.findMany({ where: whereClause }),
    tx.category.findMany({ where: whereClause }),
    tx.transaction.findMany({ where: whereClause }),
    tx.budget.findMany({ where: whereClause }),
  ]);

  return {
    accounts: accounts as any[],
    categories: categories as any[],
    transactions: transactions as any[],
    budgets: budgets as any[],
  };
}

/**
 * POST /api/v1/sync
 * Bidirectional sync endpoint - push local changes, pull server updates
 */
router.post(
  '/',
  authenticate,
  validate(syncRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;
      const userId = req.user!.userId;
      const body = req.body as SyncRequestInput;

      const lastSyncTimestamp = body.lastSyncTimestamp
        ? new Date(body.lastSyncTimestamp)
        : null;

      // Track sync start time for response
      const syncTimestamp = new Date();

      // Process all changes in a transaction with serializable isolation
      const result = await prisma.$transaction(
        async (tx) => {
          const pushResults: SyncResponse['pushResults'] = {};
          const allConflicts: SyncConflict[] = [];

          // Process changes in dependency order:
          // 1. Accounts (no dependencies)
          if (body.changes.accounts && body.changes.accounts.length > 0) {
            const { results, conflicts } = await processAccountChanges(
              tx,
              familyId,
              body.changes.accounts as SyncChangeAny[]
            );
            pushResults.accounts = results;
            allConflicts.push(...conflicts);
          }

          // 2. Categories (may reference parent category)
          if (body.changes.categories && body.changes.categories.length > 0) {
            const { results, conflicts } = await processCategoryChanges(
              tx,
              familyId,
              body.changes.categories as SyncChangeAny[]
            );
            pushResults.categories = results;
            allConflicts.push(...conflicts);
          }

          // 3. Budgets (reference categories, accounts)
          if (body.changes.budgets && body.changes.budgets.length > 0) {
            const { results, conflicts } = await processBudgetChanges(
              tx,
              familyId,
              body.changes.budgets as SyncChangeAny[]
            );
            pushResults.budgets = results;
            allConflicts.push(...conflicts);
          }

          // 4. Transactions (reference accounts, categories)
          if (body.changes.transactions && body.changes.transactions.length > 0) {
            const { results, conflicts } = await processTransactionChanges(
              tx,
              familyId,
              userId,
              body.changes.transactions as SyncChangeAny[]
            );
            pushResults.transactions = results;
            allConflicts.push(...conflicts);
          }

          // Pull changed entities since lastSyncTimestamp
          const pullData = await pullChanges(tx, familyId, lastSyncTimestamp);

          return {
            pushResults,
            pullData,
            conflicts: allConflicts,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 30000, // 30 second timeout
        }
      );

      const syncResponse: SyncResponse = {
        pushResults: result.pushResults,
        pullData: result.pullData,
        syncTimestamp: syncTimestamp.toISOString(),
        hasConflicts: result.conflicts.length > 0,
        conflicts: result.conflicts,
      };

      const response: ApiResponse<SyncResponse> = {
        data: syncResponse,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Sync error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process sync request',
        },
      };
      res.status(500).json(response);
    }
  }
);

export default router;
