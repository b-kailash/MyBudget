import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  ApiResponse,
  createInvitationSchema,
  updateMemberRoleSchema,
  updateMemberStatusSchema,
  FamilyInvitationResponse,
  FamilyMemberResponse,
} from '@mybudget/shared';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// All family routes require authentication
router.use(authenticate);

// Invitation expiry duration (7 days)
const INVITATION_EXPIRY_DAYS = 7;

/**
 * POST /api/v1/family/invite
 * Create a new family invitation (family_admin only)
 */
router.post(
  '/invite',
  requireRole('FAMILY_ADMIN'),
  validate(createInvitationSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, role } = req.body;
      const { familyId, userId } = req.user!;

      // Check if user already exists with this email
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

      // Check if there's already a pending invitation for this email in this family
      const existingInvitation = await prisma.familyInvitation.findFirst({
        where: {
          email,
          familyId,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingInvitation) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'INVITATION_EXISTS',
            message: 'An active invitation already exists for this email',
          },
        };
        res.status(409).json(response);
        return;
      }

      // Generate secure invitation token
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(inviteToken)
        .digest('hex');

      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

      // Create the invitation
      const invitation = await prisma.familyInvitation.create({
        data: {
          familyId,
          invitedByUserId: userId,
          email,
          role,
          tokenHash,
          expiresAt,
        },
        include: {
          invitedBy: {
            select: { id: true, name: true },
          },
        },
      });

      // TODO: Send invitation email with the token
      console.log(
        `Family invitation token for ${email}: ${inviteToken} (expires: ${expiresAt.toISOString()})`
      );

      const responseData: FamilyInvitationResponse = {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
        createdAt: invitation.createdAt.toISOString(),
        invitedBy: invitation.invitedBy,
      };

      const response: ApiResponse<FamilyInvitationResponse> = {
        data: responseData,
        error: null,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Create invitation error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while creating the invitation',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/v1/family/invitations
 * List pending invitations for the family (family_admin only)
 */
router.get(
  '/invitations',
  requireRole('FAMILY_ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { familyId } = req.user!;

      const invitations = await prisma.familyInvitation.findMany({
        where: {
          familyId,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: {
          invitedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const responseData: FamilyInvitationResponse[] = invitations.map(
        (inv) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          expiresAt: inv.expiresAt.toISOString(),
          createdAt: inv.createdAt.toISOString(),
          invitedBy: inv.invitedBy,
        })
      );

      const response: ApiResponse<FamilyInvitationResponse[]> = {
        data: responseData,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('List invitations error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching invitations',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * DELETE /api/v1/family/invitations/:id
 * Revoke an invitation (family_admin only)
 */
router.delete(
  '/invitations/:id',
  requireRole('FAMILY_ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { familyId } = req.user!;

      // Find the invitation
      const invitation = await prisma.familyInvitation.findFirst({
        where: {
          id,
          familyId,
          acceptedAt: null,
          revokedAt: null,
        },
      });

      if (!invitation) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Invitation not found or already used/revoked',
          },
        };
        res.status(404).json(response);
        return;
      }

      // Revoke the invitation
      await prisma.familyInvitation.update({
        where: { id },
        data: { revokedAt: new Date() },
      });

      const response: ApiResponse<{ message: string }> = {
        data: { message: 'Invitation revoked successfully' },
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Revoke invitation error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while revoking the invitation',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/v1/family/members
 * List family members
 */
router.get('/members', async (req: Request, res: Response): Promise<void> => {
  try {
    const { familyId } = req.user!;

    const members = await prisma.user.findMany({
      where: {
        familyId,
        isDeleted: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const responseData: FamilyMemberResponse[] = members.map((member) => ({
      id: member.id,
      email: member.email,
      name: member.name,
      role: member.role,
      status: member.status,
      createdAt: member.createdAt.toISOString(),
    }));

    const response: ApiResponse<FamilyMemberResponse[]> = {
      data: responseData,
      error: null,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('List members error:', error);
    const response: ApiResponse<null> = {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching members',
      },
    };
    res.status(500).json(response);
  }
});

/**
 * PUT /api/v1/family/members/:id/role
 * Change member role (family_admin only)
 */
router.put(
  '/members/:id/role',
  requireRole('FAMILY_ADMIN'),
  validate(updateMemberRoleSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const { familyId, userId } = req.user!;

      // Find the member
      const member = await prisma.user.findFirst({
        where: {
          id,
          familyId,
          isDeleted: false,
        },
      });

      if (!member) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Member not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      // Safeguard: Prevent self-demotion if only admin
      if (id === userId && role !== 'FAMILY_ADMIN') {
        const adminCount = await prisma.user.count({
          where: {
            familyId,
            role: 'FAMILY_ADMIN',
            isDeleted: false,
            status: 'ACTIVE',
          },
        });

        if (adminCount <= 1) {
          const response: ApiResponse<null> = {
            data: null,
            error: {
              code: 'LAST_ADMIN',
              message:
                'Cannot demote yourself. The family must have at least one admin.',
            },
          };
          res.status(400).json(response);
          return;
        }
      }

      // Update the role
      const updatedMember = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      const responseData: FamilyMemberResponse = {
        id: updatedMember.id,
        email: updatedMember.email,
        name: updatedMember.name,
        role: updatedMember.role,
        status: updatedMember.status,
        createdAt: updatedMember.createdAt.toISOString(),
      };

      const response: ApiResponse<FamilyMemberResponse> = {
        data: responseData,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Update member role error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating member role',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * PUT /api/v1/family/members/:id/status
 * Enable/disable member (family_admin only)
 */
router.put(
  '/members/:id/status',
  requireRole('FAMILY_ADMIN'),
  validate(updateMemberStatusSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const { familyId, userId } = req.user!;

      // Find the member
      const member = await prisma.user.findFirst({
        where: {
          id,
          familyId,
          isDeleted: false,
        },
      });

      if (!member) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Member not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      // Prevent self-disable
      if (id === userId && status === 'DISABLED') {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'CANNOT_DISABLE_SELF',
            message: 'You cannot disable your own account',
          },
        };
        res.status(400).json(response);
        return;
      }

      // Safeguard: Prevent disabling last admin
      if (
        member.role === 'FAMILY_ADMIN' &&
        status === 'DISABLED' &&
        member.status === 'ACTIVE'
      ) {
        const activeAdminCount = await prisma.user.count({
          where: {
            familyId,
            role: 'FAMILY_ADMIN',
            isDeleted: false,
            status: 'ACTIVE',
          },
        });

        if (activeAdminCount <= 1) {
          const response: ApiResponse<null> = {
            data: null,
            error: {
              code: 'LAST_ADMIN',
              message:
                'Cannot disable the last active admin. Promote another member first.',
            },
          };
          res.status(400).json(response);
          return;
        }
      }

      // Update the status
      const updatedMember = await prisma.user.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      const responseData: FamilyMemberResponse = {
        id: updatedMember.id,
        email: updatedMember.email,
        name: updatedMember.name,
        role: updatedMember.role,
        status: updatedMember.status,
        createdAt: updatedMember.createdAt.toISOString(),
      };

      const response: ApiResponse<FamilyMemberResponse> = {
        data: responseData,
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Update member status error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating member status',
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * DELETE /api/v1/family/members/:id
 * Remove member from family (family_admin only)
 * This soft-deletes the user
 */
router.delete(
  '/members/:id',
  requireRole('FAMILY_ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { familyId, userId } = req.user!;

      // Find the member
      const member = await prisma.user.findFirst({
        where: {
          id,
          familyId,
          isDeleted: false,
        },
      });

      if (!member) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Member not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      // Prevent self-removal
      if (id === userId) {
        const response: ApiResponse<null> = {
          data: null,
          error: {
            code: 'CANNOT_REMOVE_SELF',
            message: 'You cannot remove yourself from the family',
          },
        };
        res.status(400).json(response);
        return;
      }

      // Safeguard: Prevent removing last admin
      if (member.role === 'FAMILY_ADMIN' && member.status === 'ACTIVE') {
        const activeAdminCount = await prisma.user.count({
          where: {
            familyId,
            role: 'FAMILY_ADMIN',
            isDeleted: false,
            status: 'ACTIVE',
          },
        });

        if (activeAdminCount <= 1) {
          const response: ApiResponse<null> = {
            data: null,
            error: {
              code: 'LAST_ADMIN',
              message:
                'Cannot remove the last active admin. Promote another member first.',
            },
          };
          res.status(400).json(response);
          return;
        }
      }

      // Soft-delete the member and revoke their tokens
      await prisma.$transaction([
        prisma.user.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            status: 'DISABLED',
          },
        }),
        // Revoke all refresh tokens
        prisma.refreshToken.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
      ]);

      const response: ApiResponse<{ message: string }> = {
        data: { message: 'Member removed successfully' },
        error: null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Remove member error:', error);
      const response: ApiResponse<null> = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while removing the member',
        },
      };
      res.status(500).json(response);
    }
  }
);

export default router;
