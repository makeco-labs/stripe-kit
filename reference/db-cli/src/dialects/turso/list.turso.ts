import { sql } from 'drizzle-orm';
import type { ListResult, TableInfo } from '@/dialects/result.types';
import type { TursoConnection } from './types.turso';
import { getTableRowCount } from './utils.turso';

/**
 * Gets all tables from Turso database (flat list, no schemas - LibSQL/SQLite compatible)
 */
export async function listTursoTables(
  connection: TursoConnection,
  includeRowCounts = false
): Promise<ListResult> {
  try {
    // Get all user tables (excluding system and migration tables)
    const statement = sql`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT IN ('sqlite_sequence', '__drizzle_migrations', 'drizzle_migrations', '__drizzle_migrations_journal')
      ORDER BY name
    `;

    const result = await connection.db.all(statement);

    // Handle different result formats from different drivers
    const tableRows = Array.isArray(result) ? result : [result];
    const tableNames = (tableRows as Array<{ name: string }>).map(
      (row) => row.name
    );

    const tablesWithInfo: TableInfo[] = [];

    for (const tableName of tableNames) {
      const tableInfo: TableInfo = { name: tableName };

      if (includeRowCounts) {
        tableInfo.rowCount = await getTableRowCount(connection, tableName);
      }

      tablesWithInfo.push(tableInfo);
    }

    return {
      success: true,
      tables: tablesWithInfo,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to list tables';
    return {
      success: false,
      error: message,
    };
  }
}
