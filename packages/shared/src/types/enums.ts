/**
 * User role within a family budget
 */
export enum UserRole {
  /** Full administrative access to family budget */
  FAMILY_ADMIN = 'family_admin',
  /** Standard member with read/write access */
  MEMBER = 'member',
  /** Read-only access */
  VIEWER = 'viewer',
}

/**
 * User account status
 */
export enum UserStatus {
  /** Active user account */
  ACTIVE = 'active',
  /** Disabled user account */
  DISABLED = 'disabled',
}

/**
 * Type of financial account
 */
export enum AccountType {
  /** Cash account */
  CASH = 'cash',
  /** Bank account */
  BANK = 'bank',
  /** Credit card account */
  CARD = 'card',
  /** Savings account */
  SAVINGS = 'savings',
}

/**
 * Type of transaction
 */
export enum TransactionType {
  /** Income transaction */
  INCOME = 'income',
  /** Expense transaction */
  EXPENSE = 'expense',
  /** Transfer between accounts */
  TRANSFER = 'transfer',
}

/**
 * Category type matching transaction type
 */
export enum CategoryType {
  /** Income category */
  INCOME = 'income',
  /** Expense category */
  EXPENSE = 'expense',
  /** Transfer category */
  TRANSFER = 'transfer',
}

/**
 * Budget period interval
 */
export enum BudgetPeriod {
  /** Weekly budget period */
  WEEKLY = 'weekly',
  /** Monthly budget period */
  MONTHLY = 'monthly',
  /** Yearly budget period */
  YEARLY = 'yearly',
}
