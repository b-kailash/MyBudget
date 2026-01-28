import {
  UserRole,
  UserStatus,
  AccountType,
  TransactionType,
  CategoryType,
  BudgetPeriod,
} from './enums';

/**
 * Family entity - root of the budget hierarchy
 */
export interface Family {
  /** Unique identifier (UUID) */
  id: string;
  /** Family name */
  name: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * User entity - family member with access to budget
 */
export interface User {
  /** Unique identifier (UUID) */
  id: string;
  /** Associated family ID */
  familyId: string;
  /** User email address */
  email: string;
  /** User display name */
  name: string;
  /** User role within family */
  role: UserRole;
  /** User account status */
  status: UserStatus;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Soft delete flag */
  isDeleted: boolean;
  /** Deletion timestamp */
  deletedAt: Date | null;
}

/**
 * Account entity - financial account for tracking balances
 */
export interface Account {
  /** Unique identifier (UUID) */
  id: string;
  /** Associated family ID */
  familyId: string;
  /** Account name */
  name: string;
  /** Account type */
  type: AccountType;
  /** Currency code (ISO 4217) */
  currency: string;
  /** Opening balance amount */
  openingBalance: number;
  /** Whether account is active */
  isActive: boolean;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Soft delete flag */
  isDeleted: boolean;
  /** Deletion timestamp */
  deletedAt: Date | null;
  /** Optimistic locking version */
  version: number;
}

/**
 * Category entity - classification for transactions
 */
export interface Category {
  /** Unique identifier (UUID) */
  id: string;
  /** Associated family ID */
  familyId: string;
  /** Category name */
  name: string;
  /** Category type */
  type: CategoryType;
  /** Parent category ID (for subcategories) */
  parentId: string | null;
  /** Display color (hex code) */
  color: string;
  /** Icon identifier */
  icon: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Soft delete flag */
  isDeleted: boolean;
  /** Deletion timestamp */
  deletedAt: Date | null;
  /** Optimistic locking version */
  version: number;
}

/**
 * Transaction entity - record of financial activity
 */
export interface Transaction {
  /** Unique identifier (UUID) */
  id: string;
  /** Associated family ID */
  familyId: string;
  /** Source account ID */
  accountId: string;
  /** Transaction category ID */
  categoryId: string;
  /** User who created transaction */
  userId: string;
  /** Transaction type */
  type: TransactionType;
  /** Transaction amount */
  amount: number;
  /** Currency code (ISO 4217) */
  currency: string;
  /** Transaction date */
  date: Date;
  /** Payee or description */
  payee: string;
  /** Additional notes */
  notes: string;
  /** Destination account ID (for transfers) */
  transferAccountId: string | null;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Soft delete flag */
  isDeleted: boolean;
  /** Deletion timestamp */
  deletedAt: Date | null;
  /** Optimistic locking version */
  version: number;
}

/**
 * Budget entity - spending limit for category/account over period
 */
export interface Budget {
  /** Unique identifier (UUID) */
  id: string;
  /** Associated family ID */
  familyId: string;
  /** Target category ID */
  categoryId: string;
  /** Optional target account ID */
  accountId: string | null;
  /** Budget period type */
  periodType: BudgetPeriod;
  /** Budget amount */
  amount: number;
  /** Period start date */
  startDate: Date;
  /** Period end date */
  endDate: Date;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Optimistic locking version */
  version: number;
  /** Soft delete flag */
  isDeleted: boolean;
  /** Deletion timestamp */
  deletedAt: Date | null;
}

/**
 * RefreshToken entity - stored refresh tokens for authentication
 */
export interface RefreshToken {
  /** Unique identifier (UUID) */
  id: string;
  /** Associated user ID */
  userId: string;
  /** Hashed refresh token */
  tokenHash: string;
  /** Token expiration timestamp */
  expiresAt: Date;
  /** Creation timestamp */
  createdAt: Date;
  /** Revocation timestamp */
  revokedAt: Date | null;
}
