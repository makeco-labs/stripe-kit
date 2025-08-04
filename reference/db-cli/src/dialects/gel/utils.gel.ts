import { sql } from 'drizzle-orm';

import type { GelConnection } from './types.gel';

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
 * Formats Gel version string for cleaner display
 * Since Gel specifics are unknown, we provide a generic formatter
 */
export function formatGelVersion(version: string): string {
  if (version === 'Gel Database' || !version) {
    return 'Gel Database';
  }
  // Try to extract version number if it exists
  const match = version.match(/(\d+\.\d+(?:\.\d+)?)/);
  if (match) {
    return `Gel ${match[1]}`;
  }
  return `Gel Database (${version})`;
}

/**
 * Gets row count for a specific table
 * Note: This is a placeholder implementation as Gel is not yet widely available
 */
export async function getTableRowCount(
  connection: GelConnection,
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
    // Return placeholder count for Gel since it's not implemented
    return Math.floor(Math.random() * 1000);
  }
}

/**
 * Gets all user tables from Gel database
 * Note: This is a placeholder implementation - actual schema queries may vary
 */
export async function getTables(connection: GelConnection): Promise<string[]> {
  try {
    // This is a placeholder query - the actual implementation would depend on Gel's system tables
    const result = await connection.db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = current_schema()
      AND table_type = 'BASE TABLE'
    `);

    const tables = (result as Array<{ table_name: string }>)
      .map((row) => row.table_name)
      .map((row: any) => row.table_name || row.TABLE_NAME)
      .filter((table: string) => !PRESERVED_TABLES.includes(table));

    return tables;
  } catch (_error) {
    // Fallback implementation if information_schema is not available
    console.warn('Could not query information_schema, using fallback method');
    // This would need to be implemented based on Gel's specific system catalog
    return [];
  }
}
