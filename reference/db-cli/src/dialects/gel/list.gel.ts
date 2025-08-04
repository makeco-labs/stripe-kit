import { sql } from 'drizzle-orm';

import type { ListResult, TableInfo } from '@/dialects/result.types';
import type { GelConnection } from './types.gel';

/**
 * Gets all tables grouped by schema from Gel database
 * Note: This is a placeholder implementation as Gel is not yet widely available
 */
export async function listGelTables(
  connection: GelConnection,
  includeRowCounts = false
): Promise<ListResult> {
  try {
    // Placeholder implementation - actual schema queries would depend on Gel's system tables
    // For now, assume it supports standard information_schema
    const schemaStatement = sql`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'sys')
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

    // Get tables for each schema - placeholder implementation
    const schemasWithTables: { [schemaName: string]: TableInfo[] } = {};

    for (const schemaName of schemas) {
      // Placeholder tables since Gel is not implemented
      const placeholderTables: TableInfo[] = [
        {
          name: 'placeholder_table_1',
          rowCount: includeRowCounts
            ? Math.floor(Math.random() * 1000)
            : undefined,
        },
        {
          name: 'placeholder_table_2',
          rowCount: includeRowCounts
            ? Math.floor(Math.random() * 1000)
            : undefined,
        },
      ];

      schemasWithTables[schemaName] = placeholderTables;
    }

    return {
      success: true,
      schemas: schemasWithTables,
    };
  } catch {
    // Fallback for placeholder implementation
    console.warn(
      'Gel list operation failed, this is expected for placeholder implementation'
    );
    return {
      success: true,
      schemas: { public: [{ name: 'placeholder_table' }] },
    };
  }
}
