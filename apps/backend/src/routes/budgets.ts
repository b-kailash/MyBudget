import { Router, Request, Response } from 'express';
import {
  ApiResponse,
  UserRole,
  createBudgetSchema,
  updateBudgetSchema,
} from '@mybudget/shared';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/v1/budgets
 * List all budgets for the authenticated user's family
 * Optional query params: categoryId, accountId
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;
      const { categoryId, accountId } = req.query;

      const whereClause: any = {
        familyId,
        isDeleted: false,
      };

      if (categoryId && typeof categoryId === 'string') {
        whereClause.categoryId = categoryId;
      }

      if (accountId && typeof accountId === 'string') {
        whereClause.accountId = accountId;
      }

      const budgets = await prisma.budget.findMany({
        where: whereClause,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              type: true,
              color: true,
              icon: true,
            },
          },
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: {
          startDate: 'desc',
        },
      });

      const response: ApiResponse<typeof budgets> = {
        data: budgets,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve budgets',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/v1/budgets/:id
 * Get a single budget by ID
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const familyId = req.user!.familyId;

      const budget = await prisma.budget.findFirst({
        where: {
          id,
          familyId,
          isDeleted: false,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              type: true,
              color: true,
              icon: true,
            },
          },
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      if (!budget) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Budget not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof budget> = {
        data: budget,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve budget',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/v1/budgets
 * Create a new budget (family_admin only)
 */
router.post(
  '/',
  authenticate,
  requireRole(UserRole.FAMILY_ADMIN),
  validate(createBudgetSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;
      const { categoryId, accountId, periodType, amount, startDate, endDate } =
        req.body;

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

      // If accountId is provided, verify it exists and belongs to family
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

      const budget = await prisma.budget.create({
        data: {
          familyId,
          categoryId,
          accountId: accountId || null,
          periodType,
          amount,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              type: true,
              color: true,
              icon: true,
            },
          },
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      const response: ApiResponse<typeof budget> = {
        data: budget,
        error: null,
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create budget',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * PUT /api/v1/budgets/:id
 * Update an existing budget (family_admin only)
 */
router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.FAMILY_ADMIN),
  validate(updateBudgetSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const familyId = req.user!.familyId;
      const { categoryId, accountId, startDate, endDate } = req.body;

      // Check if budget exists and belongs to family (excluding soft deleted)
      const existingBudget = await prisma.budget.findFirst({
        where: {
          id,
          familyId,
          isDeleted: false,
        },
      });

      if (!existingBudget) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Budget not found',
          },
        };
        res.status(404).json(response);
        return;
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

      // If accountId is being updated, verify it exists
      if (accountId !== undefined && accountId !== null) {
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

      // Prepare update data
      const updateData: any = { ...req.body };
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);

      // Update budget with version increment
      const budget = await prisma.budget.update({
        where: { id },
        data: {
          ...updateData,
          version: { increment: 1 },
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              type: true,
              color: true,
              icon: true,
            },
          },
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      const response: ApiResponse<typeof budget> = {
        data: budget,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update budget',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * DELETE /api/v1/budgets/:id
 * Soft delete a budget (family_admin only)
 */
router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.FAMILY_ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const familyId = req.user!.familyId;

      // Check if budget exists and belongs to family (excluding soft deleted)
      const existingBudget = await prisma.budget.findFirst({
        where: {
          id,
          familyId,
          isDeleted: false,
        },
      });

      if (!existingBudget) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Budget not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      // Soft delete the budget with version increment
      const budget = await prisma.budget.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          version: { increment: 1 },
        },
      });

      const response: ApiResponse<typeof budget> = {
        data: budget,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete budget',
        },
      };
      res.status(500).json(response);
    }
  }
);

export default router;
