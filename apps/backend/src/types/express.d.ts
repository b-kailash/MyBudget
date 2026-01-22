import { UserRole } from '@mybudget/shared';

/**
 * Extend Express Request type to include authenticated user information
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * Authenticated user information (populated by auth middleware)
       */
      user?: {
        /** User's unique identifier */
        userId: string;
        /** Family's unique identifier */
        familyId: string;
        /** User's role within the family */
        role: UserRole;
      };
    }
  }
}

export {};
