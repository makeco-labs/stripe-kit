import { sql } from 'drizzle-orm';
import type { ListResult, TableInfo } from '@/dialects/result.types';
import type { PostgresConnection } from './types.postgres';
import { getTableRowCount } from './utils.postgres';

/**
 * Gets all tables grouped by schema from PostgreSQL database
 */
export async function listPostgresTables(
  connection: PostgresConnection,
  includeRowCounts = false
): Promise<ListResult> {
  try {
    // Get all user schemas (excluding system schemas)
    const schemaStatement = sql`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `;
    const schemaResult = await connection.db.execute(schemaStatement);

    // Handle different result formats from different drivers
    const schemaRows = Array.isArray(schemaResult)
      ? schemaResult
      : schemaResult.rows || [schemaResult];
    const schemas = (schemaRows as Array<{ schema_name: string }>).map(
      (row) => row.schema_name
    );

    if (schemas.length === 0) {
      return {
        success: true,
        schemas: {},
      };
    }

    // Get tables for each schema
    const schemasWithTables: { [schemaName: string]: TableInfo[] } = {};

    for (const schemaName of schemas) {
      const tableStatement = sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = ${schemaName} 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('__drizzle_migrations', 'drizzle_migrations', '__drizzle_migrations_journal')
        ORDER BY table_name
      `;

      const tableResult = await connection.db.execute(tableStatement);
      const tableRows = Array.isArray(tableResult)
        ? tableResult
        : tableResult.rows || [tableResult];
      const tableNames = (tableRows as Array<{ table_name: string }>).map(
        (row) => row.table_name
      );

      if (tableNames.length > 0) {
        const tablesWithInfo: TableInfo[] = [];

        for (const tableName of tableNames) {
          const tableInfo: TableInfo = { name: tableName };

          if (includeRowCounts) {
            tableInfo.rowCount = await getTableRowCount(
              connection,
              schemaName,
              tableName
            );
          }

          tablesWithInfo.push(tableInfo);
        }

        schemasWithTables[schemaName] = tablesWithInfo;
      }
    }

    return {
      success: true,
      schemas: schemasWithTables,
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
