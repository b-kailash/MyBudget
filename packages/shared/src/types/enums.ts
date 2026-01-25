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

/**
 * Import batch status
 */
export enum ImportStatus {
  /** Import is pending processing */
  PENDING = 'PENDING',
  /** Import is being processed */
  PROCESSING = 'PROCESSING',
  /** Import completed successfully */
  COMPLETED = 'COMPLETED',
  /** Import failed */
  FAILED = 'FAILED',
}

/**
 * Supported import file types
 */
export enum ImportFileType {
  /** Comma-separated values */
  CSV = 'CSV',
  /** Excel 2007+ format */
  XLSX = 'XLSX',
  /** Excel 97-2003 format */
  XLS = 'XLS',
  /** Open Financial Exchange format */
  OFX = 'OFX',
  /** Quicken Financial Exchange format */
  QFX = 'QFX',
  /** Quicken Interchange Format */
  QIF = 'QIF',
}
