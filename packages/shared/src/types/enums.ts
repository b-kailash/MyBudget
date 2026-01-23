/**
 * User role within a family budget
 */
export enum UserRole {
  /** Full administrative access to family budget */
  FAMILY_ADMIN = 'FAMILY_ADMIN',
  /** Standard member with read/write access */
  MEMBER = 'MEMBER',
  /** Read-only access */
  VIEWER = 'VIEWER',
}

/**
 * User account status
 */
export enum UserStatus {
  /** Active user account */
  ACTIVE = 'ACTIVE',
  /** Disabled user account */
  DISABLED = 'DISABLED',
}

/**
 * Type of financial account
 */
export enum AccountType {
  /** Cash account */
  CASH = 'CASH',
  /** Bank account */
  BANK = 'BANK',
  /** Credit card account */
  CARD = 'CARD',
  /** Savings account */
  SAVINGS = 'SAVINGS',
}

/**
 * Type of transaction
 */
export enum TransactionType {
  /** Income transaction */
  INCOME = 'INCOME',
  /** Expense transaction */
  EXPENSE = 'EXPENSE',
  /** Transfer between accounts */
  TRANSFER = 'TRANSFER',
}

/**
 * Category type matching transaction type
 */
export enum CategoryType {
  /** Income category */
  INCOME = 'INCOME',
  /** Expense category */
  EXPENSE = 'EXPENSE',
  /** Transfer category */
  TRANSFER = 'TRANSFER',
}

/**
 * Budget period interval
 */
export enum BudgetPeriod {
  /** Weekly budget period */
  WEEKLY = 'WEEKLY',
  /** Monthly budget period */
  MONTHLY = 'MONTHLY',
  /** Yearly budget period */
  YEARLY = 'YEARLY',
}
