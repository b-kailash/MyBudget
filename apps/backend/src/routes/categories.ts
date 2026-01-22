import { Router, Request, Response } from 'express';
import {
  ApiResponse,
  UserRole,
  createCategorySchema,
  updateCategorySchema,
} from '@mybudget/shared';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/v1/categories
 * List all categories for the authenticated user's family in tree structure
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;

      // Fetch all categories
      const allCategories = await prisma.category.findMany({
        where: {
          familyId,
          isDeleted: false,
        },
        orderBy: {
          name: 'asc',
        },
      });

      // Build tree structure
      const categoryMap = new Map();
      const rootCategories: any[] = [];

      // First pass: create map of all categories with children array
      allCategories.forEach((category) => {
        categoryMap.set(category.id, { ...category, children: [] });
      });

      // Second pass: build tree structure
      allCategories.forEach((category) => {
        const categoryWithChildren = categoryMap.get(category.id);
        if (category.parentId) {
          const parent = categoryMap.get(category.parentId);
          if (parent) {
            parent.children.push(categoryWithChildren);
          } else {
            // Parent not found or deleted, treat as root
            rootCategories.push(categoryWithChildren);
          }
        } else {
          rootCategories.push(categoryWithChildren);
        }
      });

      const response: ApiResponse<typeof rootCategories> = {
        data: rootCategories,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve categories',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/v1/categories/:id
 * Get a single category by ID
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const familyId = req.user!.familyId;

      const category = await prisma.category.findFirst({
        where: {
          id,
          familyId,
          isDeleted: false,
        },
        include: {
          children: {
            where: {
              isDeleted: false,
            },
          },
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

      const response: ApiResponse<typeof category> = {
        data: category,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve category',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /api/v1/categories
 * Create a new category (family_admin only)
 */
router.post(
  '/',
  authenticate,
  requireRole(UserRole.FAMILY_ADMIN),
  validate(createCategorySchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const familyId = req.user!.familyId;
      const { name, type, parentId, color, icon } = req.body;

      // If parentId is provided, verify it exists and belongs to the family
      if (parentId) {
        const parentCategory = await prisma.category.findFirst({
          where: {
            id: parentId,
            familyId,
            isDeleted: false,
          },
        });

        if (!parentCategory) {
          const response: ApiResponse<null> = {
            data: null,
            error: {
              code: 'NOT_FOUND',
              message: 'Parent category not found',
            },
          };
          res.status(404).json(response);
          return;
        }
      }

      const category = await prisma.category.create({
        data: {
          familyId,
          name,
          type,
          parentId: parentId || null,
          color,
          icon,
        },
      });

      const response: ApiResponse<typeof category> = {
        data: category,
        error: null,
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create category',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * PUT /api/v1/categories/:id
 * Update an existing category (family_admin only)
 */
router.put(
  '/:id',
  authenticate,
  requireRole(UserRole.FAMILY_ADMIN),
  validate(updateCategorySchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const familyId = req.user!.familyId;
      const { parentId } = req.body;

      // Check if category exists and belongs to family
      const existingCategory = await prisma.category.findFirst({
        where: {
          id,
          familyId,
          isDeleted: false,
        },
      });

      if (!existingCategory) {
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

      // If parentId is being updated, verify it exists and prevent circular reference
      if (parentId !== undefined && parentId !== null) {
        if (parentId === id) {
          const response: ApiResponse<null> = {
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'A category cannot be its own parent',
            },
          };
          res.status(400).json(response);
          return;
        }

        const parentCategory = await prisma.category.findFirst({
          where: {
            id: parentId,
            familyId,
            isDeleted: false,
          },
        });

        if (!parentCategory) {
          const response: ApiResponse<null> = {
            data: null,
            error: {
              code: 'NOT_FOUND',
              message: 'Parent category not found',
            },
          };
          res.status(404).json(response);
          return;
        }
      }

      // Update category
      const category = await prisma.category.update({
        where: { id },
        data: req.body,
      });

      const response: ApiResponse<typeof category> = {
        data: category,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update category',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * DELETE /api/v1/categories/:id
 * Soft delete a category (family_admin only)
 */
router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.FAMILY_ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const familyId = req.user!.familyId;

      // Check if category exists and belongs to family
      const existingCategory = await prisma.category.findFirst({
        where: {
          id,
          familyId,
          isDeleted: false,
        },
      });

      if (!existingCategory) {
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

      // Soft delete the category
      const category = await prisma.category.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      const response: ApiResponse<typeof category> = {
        data: category,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete category',
        },
      };
      res.status(500).json(response);
    }
  }
);

export default router;
