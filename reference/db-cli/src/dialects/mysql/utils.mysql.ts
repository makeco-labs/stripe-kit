import { sql } from 'drizzle-orm';

import type { MysqlConnection } from './types.mysql';

// System tables that should not be dropped/truncated
const _SYSTEM_TABLES = [
  'information_schema',
  'mysql',
  'performance_schema',
  'sys',
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

// Regex for parsing MySQL version strings
const MYSQL_VERSION_REGEX = /^(\d+\.\d+\.\d+)/;

/**
 * Formats MySQL version string for cleaner display
 * Example: "8.0.39-0ubuntu0.22.04.1" becomes "MySQL 8.0.39"
 */
export function formatMysqlVersion(version: string): string {
  const match = version.match(MYSQL_VERSION_REGEX);
  if (match) {
    return `MySQL ${match[1]}`;
  }
  return `MySQL ${version}`;
}

/**
 * Gets row count for a specific table
 */
export async function getTableRowCount(
  connection: MysqlConnection,
  schemaName: string,
  tableName: string
): Promise<number> {
  try {
    const statement = sql`SELECT COUNT(*) as count FROM ${sql.identifier(schemaName)}.${sql.identifier(tableName)}`;
    const result = await connection.db.execute(statement);

    // Handle different result formats from different drivers
    const rows = Array.isArray(result) ? result : result.rows || [result];
    const count = (rows as Array<{ count: string | number }>)[0]?.count;

    return typeof count === 'string' ? Number.parseInt(count, 10) : count || 0;
  } catch (error) {
    console.warn(
      `Failed to get row count for ${schemaName}.${tableName}:`,
      error instanceof Error ? error.message : error
    );
    return 0;
  }
}

/**
 * Gets all user tables from MySQL database
 */
export async function getTables(
  connection: MysqlConnection
): Promise<string[]> {
  const result = await connection.db.execute(sql`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_TYPE = 'BASE TABLE'
  `);

  const tables = result[0]
    .map((row: any) => row.TABLE_NAME)
    .filter((table: string) => !PRESERVED_TABLES.includes(table));

  return tables;
}

/**
 * Gets foreign key constraints for a table
 */
export async function getTableConstraints(
  connection: MysqlConnection,
  tableName: string
): Promise<string[]> {
  const result = await connection.db.execute(sql`
    SELECT CONSTRAINT_NAME
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = ${tableName}
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  `);

  return result[0].map((row: any) => row.CONSTRAINT_NAME);
}
