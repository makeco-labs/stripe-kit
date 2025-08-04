import { sql } from 'drizzle-orm';
import type { ListResult, TableInfo } from '@/dialects/result.types';
import type { SingleStoreConnection } from './types.singlestore';
import { getTableRowCount } from './utils.singlestore';

/**
 * Gets all tables grouped by schema from SingleStore database
 */
export async function listSingleStoreTables(
  connection: SingleStoreConnection,
  includeRowCounts = false
): Promise<ListResult> {
  try {
    // Get all user schemas (excluding system schemas)
    const schemaStatement = sql`
      SELECT SCHEMA_NAME as schema_name
      FROM information_schema.SCHEMATA
      WHERE SCHEMA_NAME NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys', 'cluster')
      ORDER BY SCHEMA_NAME
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
        SELECT TABLE_NAME as table_name
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ${schemaName} 
        AND TABLE_TYPE = 'BASE TABLE'
        AND TABLE_NAME NOT IN ('__drizzle_migrations', 'drizzle_migrations', '__drizzle_migrations_journal')
        ORDER BY TABLE_NAME
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
