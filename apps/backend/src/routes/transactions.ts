import { Router, Request, Response } from 'express';
import {
  ApiResponse,
  UserRole,
  TransactionType,
  createTransactionSchema,
  updateTransactionSchema,
} from '@mybudget/shared';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/v1/transactions
 * List transactions with pagination and filters
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - startDate: Filter by start date (ISO 8601)
 * - endDate: Filter by end date (ISO 8601)
 * - accountId: Filter by account ID
 * - categoryId: Filter by category ID
 * - userId: Filter by user ID
 * - type: Filter by transaction type (income, expense, transfer)
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;
      const {
        page = '1',
        limit = '20',
        startDate,
        endDate,
        accountId,
        categoryId,
        userId,
        type,
      } = req.query;

      // Parse pagination params
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(
        100,
        Math.max(1, parseInt(limit as string, 10) || 20)
      );
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const whereClause: any = {
        familyId,
        isDeleted: false,
      };

      if (startDate && typeof startDate === 'string') {
        whereClause.date = {
          ...whereClause.date,
          gte: new Date(startDate),
        };
      }

      if (endDate && typeof endDate === 'string') {
        whereClause.date = {
          ...whereClause.date,
          lte: new Date(endDate),
        };
      }

      if (accountId && typeof accountId === 'string') {
        whereClause.accountId = accountId;
      }

      if (categoryId && typeof categoryId === 'string') {
        whereClause.categoryId = categoryId;
      }

      if (userId && typeof userId === 'string') {
        whereClause.userId = userId;
      }

      if (type && typeof type === 'string') {
        whereClause.type = type.toUpperCase() as TransactionType;
      }

      // Fetch transactions with pagination
      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: whereClause,
          include: {
            account: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                type: true,
                color: true,
                icon: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            transferAccount: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
          skip,
          take: limitNum,
        }),
        prisma.transaction.count({
          where: whereClause,
        }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      const response: ApiResponse<{
        items: typeof transactions;
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }> = {
        data: {
          items: transactions,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
          },
        },
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve transactions',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/v1/transactions/:id
 * Get a single transaction by ID
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const familyId = req.user!.familyId;

      const transaction = await prisma.transaction.findFirst({
        where: {
          id,
          familyId,
          isDeleted: false,
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              type: true,
              color: true,
              icon: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          transferAccount: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      if (!transaction) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof transaction> = {
        data: transaction,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve transaction',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/v1/transactions
 * Create a new transaction (all authenticated users)
 */
router.post(
  '/',
  authenticate,
  validate(createTransactionSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;
      const userId = req.user!.userId;
      const {
        accountId,
        categoryId,
        type,
        amount,
        currency,
        date,
        payee,
        notes,
        transferAccountId,
      } = req.body;

      // Verify account exists and belongs to family
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          familyId,
          isDeleted: false,
        },
      });

      if (!account) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Account not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      // Verify category exists and belongs to family
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          familyId,
          isDeleted: false,
        },
      });

      if (!category) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Category not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      // If transfer transaction, verify transfer account exists
      if (type === TransactionType.TRANSFER && transferAccountId) {
        const transferAccount = await prisma.account.findFirst({
          where: {
            id: transferAccountId,
            familyId,
            isDeleted: false,
          },
        });

        if (!transferAccount) {
          const response: ApiResponse<null> = {
            data: null,
            error: {
              code: 'NOT_FOUND',
              message: 'Transfer account not found',
            },
          };
          res.status(404).json(response);
          return;
        }
      }

      const transaction = await prisma.transaction.create({
        data: {
          familyId,
          accountId,
          categoryId,
          userId,
          type,
          amount,
          currency,
          date: new Date(date),
          payee,
          notes: notes || '',
          transferAccountId: transferAccountId || null,
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              type: true,
              color: true,
              icon: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          transferAccount: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      const response: ApiResponse<typeof transaction> = {
        data: transaction,
        error: null,
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create transaction',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * PUT /api/v1/transactions/:id
 * Update an existing transaction (owner or family_admin)
 */
router.put(
  '/:id',
  authenticate,
  validate(updateTransactionSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const familyId = req.user!.familyId;
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const { accountId, categoryId, date } = req.body;

      // Check if transaction exists and belongs to family
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          id,
          familyId,
          isDeleted: false,
        },
      });

      if (!existingTransaction) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      // Check authorization: owner or family_admin
      if (
        existingTransaction.userId !== userId &&
        userRole !== UserRole.FAMILY_ADMIN
      ) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this transaction',
          },
        };
        res.status(403).json(response);
        return;
      }

      // If accountId is being updated, verify it exists
      if (accountId) {
        const account = await prisma.account.findFirst({
          where: {
            id: accountId,
            familyId,
            isDeleted: false,
          },
        });

        if (!account) {
          const response: ApiResponse<null> = {
            data: null,
            error: {
              code: 'NOT_FOUND',
              message: 'Account not found',
            },
          };
          res.status(404).json(response);
          return;
        }
      }

      // If categoryId is being updated, verify it exists
      if (categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: categoryId,
            familyId,
            isDeleted: false,
          },
        });

        if (!category) {
          const response: ApiResponse<null> = {
            data: null,
            error: {
              code: 'NOT_FOUND',
              message: 'Category not found',
            },
          };
          res.status(404).json(response);
          return;
        }
      }

      // Prepare update data
      const updateData: any = { ...req.body };
      if (date) updateData.date = new Date(date);

      // Update transaction
      const transaction = await prisma.transaction.update({
        where: { id },
        data: updateData,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              type: true,
              color: true,
              icon: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          transferAccount: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      const response: ApiResponse<typeof transaction> = {
        data: transaction,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update transaction',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * DELETE /api/v1/transactions/:id
 * Soft delete a transaction (owner or family_admin)
 */
router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const familyId = req.user!.familyId;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Check if transaction exists and belongs to family
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          id,
          familyId,
          isDeleted: false,
        },
      });

      if (!existingTransaction) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      // Check authorization: owner or family_admin
      if (
        existingTransaction.userId !== userId &&
        userRole !== UserRole.FAMILY_ADMIN
      ) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this transaction',
          },
        };
        res.status(403).json(response);
        return;
      }

      // Soft delete the transaction
      const transaction = await prisma.transaction.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      const response: ApiResponse<typeof transaction> = {
        data: transaction,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete transaction',
        },
      };
      res.status(500).json(response);
    }
  }
);

export default router;
