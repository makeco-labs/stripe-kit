import { sql } from 'drizzle-orm';
import type { TruncateResult } from '@/dialects/result.types';
import type { PostgresConnection } from './types.postgres';
import { getSchemas, getTables, getTablesInSchemas } from './utils.postgres';

/**
 * Truncates PostgreSQL database by deleting all data from user tables while preserving table structure
 */
export async function truncatePostgresDatabase(
  connection: PostgresConnection
): Promise<TruncateResult> {
  const tablesTruncated: string[] = [];

  try {
    // Disable foreign key checks by deferring constraints
    await connection.db.execute(sql`SET session_replication_role = replica`);
    console.log('Foreign key constraints disabled');

    // Get tables in public schema
    const publicTables = await getTables(connection);
    console.log('Public tables to truncate:', publicTables.join(', '));

    for (const table of publicTables) {
      const truncateStatement = sql`TRUNCATE TABLE ${sql.identifier(table)} RESTART IDENTITY CASCADE`;
      await connection.db.execute(truncateStatement);
      tablesTruncated.push(table);
      console.log(`Truncated table: ${table}`);
    }

    // Get user schemas and their tables
    const schemas = await getSchemas(connection);
    const schemaTables = await getTablesInSchemas(connection, schemas);
    console.log('Schema tables to truncate:', schemaTables.join(', '));

    for (const fullTableName of schemaTables) {
      const [schema, table] = fullTableName.split('.');
      const truncateStatement = sql`TRUNCATE TABLE ${sql.identifier(schema)}.${sql.identifier(table)} RESTART IDENTITY CASCADE`;
      await connection.db.execute(truncateStatement);
      tablesTruncated.push(fullTableName);
      console.log(`Truncated table: ${fullTableName}`);
    }

    // Re-enable foreign key checks
    await connection.db.execute(sql`SET session_replication_role = default`);
    console.log('Foreign key constraints enabled');

    console.log('Database truncate completed');
    return {
      success: true,
      tablesTruncated,
    };
  } catch (e) {
    console.error('Error truncating database:', e);
    // Try to restore foreign key checks in case of error
    try {
      await connection.db.execute(sql`SET session_replication_role = default`);
    } catch (restoreError) {
      console.error('Error restoring foreign key checks:', restoreError);
    }
    throw e;
  }
}
