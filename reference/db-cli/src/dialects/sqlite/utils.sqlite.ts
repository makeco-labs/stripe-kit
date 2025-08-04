import { sql } from 'drizzle-orm';

import type { SQLiteConnection } from './types.sqlite';

// ========================================================================
// SQLITE URL NORMALIZATION
// ========================================================================

/**
 * Normalizes SQLite URL for different drivers
 */
export const normalizeSQLiteUrl = (
  url: string,
  type: 'libsql' | 'better-sqlite'
): string => {
  if (type === 'libsql') {
    if (url.startsWith('file:')) {
      return url;
    }
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol === null) {
        return `file:${url}`;
      }
      return url;
    } catch {
      return `file:${url}`;
    }
  }

  if (type === 'better-sqlite') {
    if (url.startsWith('file:')) {
      return url.substring(5);
    }
    return url;
  }

  throw new Error(`Unknown SQLite driver type: ${type}`);
};

// ========================================================================
// SQLITE TABLE UTILITIES
// ========================================================================

// Tables to preserve during operations
export const tableAllowlist = [
  'sqlite_sequence',
  'sqlite_master',
  'migrations',
  'drizzle_migrations',
  'drizzle_query_log',
  'drizzle_query_log_entries',
];

// ========================================================================
// VERSION FORMATTING
// ========================================================================

/**
 * Formats SQLite version string for cleaner display
 * Example: "3.45.1" becomes "SQLite 3.45.1"
 */
export function formatSqliteVersion(version: string): string {
  // SQLite version is just a version number, so add the prefix
  return `SQLite ${version}`;
}

/**
 * Gets row count for a specific table
 */
export async function getTableRowCount(
  connection: SQLiteConnection,
  tableName: string
): Promise<number> {
  try {
    const statement = sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`;
    const result = await connection.db.all(statement);

    // Handle different result formats from different drivers
    const rows = Array.isArray(result) ? result : [result];
    const count = (rows as Array<{ count: string | number }>)[0]?.count;

    return typeof count === 'string' ? Number.parseInt(count, 10) : count || 0;
  } catch (error) {
    console.warn(
      `Failed to get row count for ${tableName}:`,
      error instanceof Error ? error.message : error
    );
    return 0;
  }
}

/**
 * Gets all user tables in the database
 */
export async function getTables(
  connection: SQLiteConnection
): Promise<string[]> {
  const statement = sql`SELECT name FROM sqlite_master WHERE type='table'`;
  const result = await connection.db.all(statement);
  // console.log('result', result);

  // Handle different result formats from different drivers
  const tables = Array.isArray(result) ? result : [result];

  return (tables as Array<{ name: string }>)
    .map((row) => row.name) // Extract table names
    .filter((table) => table && !tableAllowlist.includes(table)); // Filter out null/undefined and system tables
}
