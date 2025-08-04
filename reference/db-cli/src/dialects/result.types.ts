// ========================================================================
// SHARED RESULT TYPES
// ========================================================================

/**
 * Result type for database health check operations
 */
export interface HealthCheckResult {
  status: 'ok' | 'error';
  message?: string;
  timestamp: string;
  version?: string;
}

/**
 * Result type for database reset operations
 */
export interface ResetResult {
  success: boolean;
  tablesDropped: string[];
  error?: string;
}

/**
 * Result type for database truncate operations
 */
export interface TruncateResult {
  success: boolean;
  tablesTruncated: string[];
  error?: string;
}

/**
 * Result type for database seed operations
 */
export interface SeedResult {
  success: boolean;
  message?: string;
  error?: string;
  timestamp: string;
}

/**
 * Table information with optional row count
 */
export interface TableInfo {
  name: string;
  rowCount?: number;
}

/**
 * Result type for database list operations
 */
export interface ListResult {
  success: boolean;
  schemas?: { [schemaName: string]: TableInfo[] };
  tables?: TableInfo[];
  error?: string;
}
