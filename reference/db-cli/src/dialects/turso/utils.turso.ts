import { sql } from 'drizzle-orm';

import type { TursoConnection } from './types.turso';

// System tables that should not be dropped/truncated (same as SQLite since Turso is LibSQL/SQLite-compatible)
const SYSTEM_TABLES = [
  'sqlite_sequence',
  'sqlite_master',
  'sqlite_temp_master',
];

// Migration/history tables to preserve
const PRESERVED_TABLES = [
  '__drizzle_migrations',
  'drizzle_migrations',
  '__drizzle_migrations_journal',
];

// ========================================================================
// VERSION FORMATTING
// ========================================================================

/**
 * Formats Turso version string for cleaner display
 * Example: "3.45.1" becomes "Turso (SQLite 3.45.1)"
 */
export function formatTursoVersion(version: string): string {
  return `Turso (SQLite ${version})`;
}

/**
 * Gets row count for a specific table
 */
export async function getTableRowCount(
  connection: TursoConnection,
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
 * Gets all user tables from Turso database
 */
export async function getTables(
  connection: TursoConnection
): Promise<string[]> {
  const statement = sql`SELECT name FROM sqlite_master WHERE type='table'`;
  const result = await connection.db.all(statement);

  const tables = result
    .map((row: any) => row.name)
    .filter(
      (table: string) =>
        !(SYSTEM_TABLES.includes(table) || PRESERVED_TABLES.includes(table))
    );

  return tables;
}
