import {
  UserRole,
  UserStatus,
  AccountType,
  TransactionType,
  CategoryType,
  BudgetPeriod,
} from './enums';

/**
 * Standard API error response
 */
export interface ApiError {
  /** Error code for client handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: unknown;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  /** Response data (null on error) */
  data: T | null;
  /** Error details (null on success) */
  error: ApiError | null;
}

// ============================================================================
// Authentication API Types
// ============================================================================

/**
 * User registration request
 */
export interface RegisterRequest {
  /** User email address */
  email: string;
  /** User password */
  password: string;
  /** User display name */
  name: string;
  /** Family name (for new family creation) */
  familyName: string;
}

/**
 * User login request
 */
export interface LoginRequest {
  /** User email address */
  email: string;
  /** User password */
  password: string;
}

/**
 * Login response with tokens
 */
export interface LoginResponse {
  /** JWT access token */
  accessToken: string;
  /** Refresh token for obtaining new access tokens */
  refreshToken: string;
  /** User information */
  user: {
    id: string;
    email: string;
    name: string;
    familyId: string;
    role: UserRole;
  };
}

/**
 * Token refresh request
 */
export interface RefreshRequest {
  /** Refresh token */
  refreshToken: string;
}

/**
 * Token refresh response
 */
export interface RefreshResponse {
  /** New JWT access token */
  accessToken: string;
  /** New refresh token */
  refreshToken: string;
}

// ============================================================================
// Account API Types
// ============================================================================

/**
 * Create account request
 */
export interface CreateAccountRequest {
  /** Account name */
  name: string;
  /** Account type */
  type: AccountType;
  /** Currency code (ISO 4217) */
  currency: string;
  /** Opening balance amount */
  openingBalance: number;
  /** Whether account is active */
  isActive?: boolean;
}

/**
 * Update account request
 */
export interface UpdateAccountRequest {
  /** Account name */
  name?: string;
  /** Account type */
  type?: AccountType;
  /** Currency code (ISO 4217) */
  currency?: string;
  /** Opening balance amount */
  openingBalance?: number;
  /** Whether account is active */
  isActive?: boolean;
}

// ============================================================================
// Category API Types
// ============================================================================

/**
 * Create category request
 */
export interface CreateCategoryRequest {
  /** Category name */
  name: string;
  /** Category type */
  type: CategoryType;
  /** Parent category ID (for subcategories) */
  parentId?: string | null;
  /** Display color (hex code) */
  color: string;
  /** Icon identifier */
  icon: string;
}

/**
 * Update category request
 */
export interface UpdateCategoryRequest {
  /** Category name */
  name?: string;
  /** Category type */
  type?: CategoryType;
  /** Parent category ID (for subcategories) */
  parentId?: string | null;
  /** Display color (hex code) */
  color?: string;
  /** Icon identifier */
  icon?: string;
}

// ============================================================================
// Transaction API Types
// ============================================================================

/**
 * Create transaction request
 */
export interface CreateTransactionRequest {
  /** Source account ID */
  accountId: string;
  /** Transaction category ID */
  categoryId: string;
  /** Transaction type */
  type: TransactionType;
  /** Transaction amount */
  amount: number;
  /** Currency code (ISO 4217) */
  currency: string;
  /** Transaction date (ISO 8601 string) */
  date: string;
  /** Payee or description */
  payee: string;
  /** Additional notes */
  notes?: string;
  /** Destination account ID (for transfers) */
  transferAccountId?: string | null;
}

/**
 * Update transaction request
 */
export interface UpdateTransactionRequest {
  /** Source account ID */
  accountId?: string;
  /** Transaction category ID */
  categoryId?: string;
  /** Transaction type */
  type?: TransactionType;
  /** Transaction amount */
  amount?: number;
  /** Currency code (ISO 4217) */
  currency?: string;
  /** Transaction date (ISO 8601 string) */
  date?: string;
  /** Payee or description */
  payee?: string;
  /** Additional notes */
  notes?: string;
  /** Destination account ID (for transfers) */
  transferAccountId?: string | null;
}

// ============================================================================
// Budget API Types
// ============================================================================

/**
 * Create budget request
 */
export interface CreateBudgetRequest {
  /** Target category ID */
  categoryId: string;
  /** Optional target account ID */
  accountId?: string | null;
  /** Budget period type */
  periodType: BudgetPeriod;
  /** Budget amount */
  amount: number;
  /** Period start date (ISO 8601 string) */
  startDate: string;
  /** Period end date (ISO 8601 string) */
  endDate: string;
}

/**
 * Update budget request
 */
export interface UpdateBudgetRequest {
  /** Target category ID */
  categoryId?: string;
  /** Optional target account ID */
  accountId?: string | null;
  /** Budget period type */
  periodType?: BudgetPeriod;
  /** Budget amount */
  amount?: number;
  /** Period start date (ISO 8601 string) */
  startDate?: string;
  /** Period end date (ISO 8601 string) */
  endDate?: string;
}

// ============================================================================
// User API Types
// ============================================================================

/**
 * Create user request (invite member to family)
 */
export interface CreateUserRequest {
  /** User email address */
  email: string;
  /** User display name */
  name: string;
  /** User role within family */
  role: UserRole;
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  /** User display name */
  name?: string;
  /** User role within family */
  role?: UserRole;
  /** User account status */
  status?: UserStatus;
}

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Paginated request parameters
 */
export interface PaginatedRequest {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of items for current page */
  items: T[];
  /** Total number of items */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrev: boolean;
}
