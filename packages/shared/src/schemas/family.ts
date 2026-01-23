import { z } from 'zod';
import { emailSchema } from './common';

/**
 * Invite role enum - roles that can be assigned to invited users
 * Note: FAMILY_ADMIN cannot be invited, only promoted
 */
export const inviteRoleSchema = z.enum(['MEMBER', 'VIEWER']);
export type InviteRole = z.infer<typeof inviteRoleSchema>;

/**
 * Create family invitation schema
 */
export const createInvitationSchema = z.object({
  /** Email address of the person to invite */
  email: emailSchema,
  /** Role to assign to the invited user */
  role: inviteRoleSchema,
});

/**
 * Accept invitation schema
 */
export const acceptInvitationSchema = z.object({
  /** Invitation token */
  token: z.string().min(1, 'Invitation token is required'),
  /** User's name */
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  /** User's password */
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

/**
 * Update member role schema
 */
export const updateMemberRoleSchema = z.object({
  /** New role for the member */
  role: z.enum(['FAMILY_ADMIN', 'MEMBER', 'VIEWER']),
});

/**
 * Update member status schema
 */
export const updateMemberStatusSchema = z.object({
  /** New status for the member */
  status: z.enum(['ACTIVE', 'DISABLED']),
});

/**
 * Family invitation response type
 */
export interface FamilyInvitationResponse {
  id: string;
  email: string;
  role: InviteRole;
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    id: string;
    name: string;
  };
}

/**
 * Family member response type
 */
export interface FamilyMemberResponse {
  id: string;
  email: string;
  name: string;
  role: 'FAMILY_ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
}
