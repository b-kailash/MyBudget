import { Router, Request, Response } from 'express';
import {
  ApiResponse,
  UserRole,
  createAccountSchema,
  updateAccountSchema,
} from '@mybudget/shared';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/v1/accounts
 * List all accounts for the authenticated user's family (excluding soft deleted)
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;

      const accounts = await prisma.account.findMany({
        where: {
          familyId,
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const response: ApiResponse<typeof accounts> = {
        data: accounts,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve accounts',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/v1/accounts/:id
 * Get a single account by ID
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const familyId = req.user!.familyId;

      const account = await prisma.account.findFirst({
        where: {
          id,
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

      const response: ApiResponse<typeof account> = {
        data: account,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve account',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/v1/accounts
 * Create a new account (family_admin only)
 */
router.post(
  '/',
  authenticate,
  requireRole(UserRole.FAMILY_ADMIN),
  validate(createAccountSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;
      const { name, type, currency, openingBalance, isActive } = req.body;

      const account = await prisma.account.create({
        data: {
          familyId,
          name,
          type,
          currency,
          openingBalance,
          isActive: isActive ?? true,
        },
      });

      const response: ApiResponse<typeof account> = {
        data: account,
        error: null,
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create account',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * PUT /api/v1/accounts/:id
 * Update an existing account (family_admin only)
 */
router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.FAMILY_ADMIN),
  validate(updateAccountSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const familyId = req.user!.familyId;

      // Check if account exists and belongs to family
      const existingAccount = await prisma.account.findFirst({
        where: {
          id,
          familyId,
          isDeleted: false,
        },
      });

      if (!existingAccount) {
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

      // Update account with version increment
      const account = await prisma.account.update({
        where: { id },
        data: {
          ...req.body,
          version: { increment: 1 },
        },
      });

      const response: ApiResponse<typeof account> = {
        data: account,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update account',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * DELETE /api/v1/accounts/:id
 * Soft delete an account (family_admin only)
 */
router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.FAMILY_ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const familyId = req.user!.familyId;

      // Check if account exists and belongs to family
      const existingAccount = await prisma.account.findFirst({
        where: {
          id,
          familyId,
          isDeleted: false,
        },
      });

      if (!existingAccount) {
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

      // Soft delete the account with version increment
      const account = await prisma.account.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          version: { increment: 1 },
        },
      });

      const response: ApiResponse<typeof account> = {
        data: account,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete account',
        },
      };
      res.status(500).json(response);
    }
  }
);

export default router;
