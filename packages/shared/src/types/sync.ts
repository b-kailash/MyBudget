import { Account, Category, Transaction, Budget } from './entities';

/**
 * Sync operation types
 */
export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';

/**
 * Syncable entity types
 */
export type SyncEntityType = 'account' | 'category' | 'transaction' | 'budget';

/**
 * Individual change to be synced
 */
export interface SyncChange<T = unknown> {
  /** Entity type being changed */
  entityType: SyncEntityType;
  /** Operation to perform */
  operation: SyncOperation;
  /** Entity ID (client-generated UUID for CREATE) */
  id: string;
  /** Client's version of the entity (0 for CREATE) */
  clientVersion: number;
  /** Entity data (partial for UPDATE, null for DELETE) */
  data: T | null;
  /** Client timestamp when change was made */
  clientTimestamp: string;
}

/**
 * Sync request payload
 */
export interface SyncRequest {
  /** Last successful sync timestamp (null for initial sync) */
  lastSyncTimestamp: string | null;
  /** Changes to push to server, grouped by entity type */
  changes: {
    accounts?: SyncChange<Partial<Account>>[];
    categories?: SyncChange<Partial<Category>>[];
    transactions?: SyncChange<Partial<Transaction>>[];
    budgets?: SyncChange<Partial<Budget>>[];
  };
  /** Client device identifier for debugging */
  clientId?: string;
}

/**
 * Result for a single push operation
 */
export interface SyncPushResult {
  /** Entity ID */
  id: string;
  /** Whether the operation succeeded */
  success: boolean;
  /** New version after operation (if successful) */
  newVersion?: number;
  /** Error code if failed */
  errorCode?: 'CONFLICT' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'FORBIDDEN';
  /** Error message if failed */
  errorMessage?: string;
  /** Server entity state (returned on conflict) */
  serverEntity?: unknown;
}

/**
 * Sync conflict details
 */
export interface SyncConflict {
  /** Entity type */
  entityType: SyncEntityType;
  /** Entity ID */
  id: string;
  /** Version client expected */
  clientVersion: number;
  /** Current server version */
  serverVersion: number;
  /** Current server entity state */
  serverEntity: Account | Category | Transaction | Budget;
}

/**
 * Data pulled from server
 */
export interface SyncPullData {
  /** Updated/new accounts since lastSyncTimestamp */
  accounts: Account[];
  /** Updated/new categories since lastSyncTimestamp */
  categories: Category[];
  /** Updated/new transactions since lastSyncTimestamp */
  transactions: Transaction[];
  /** Updated/new budgets since lastSyncTimestamp */
  budgets: Budget[];
}

/**
 * Sync response payload
 */
export interface SyncResponse {
  /** Results of push operations, grouped by entity type */
  pushResults: {
    accounts?: SyncPushResult[];
    categories?: SyncPushResult[];
    transactions?: SyncPushResult[];
    budgets?: SyncPushResult[];
  };
  /** Data pulled from server */
  pullData: SyncPullData;
  /** Server timestamp of this sync (use for next lastSyncTimestamp) */
  syncTimestamp: string;
  /** Whether any conflicts occurred */
  hasConflicts: boolean;
  /** Detailed conflict information */
  conflicts: SyncConflict[];
}
