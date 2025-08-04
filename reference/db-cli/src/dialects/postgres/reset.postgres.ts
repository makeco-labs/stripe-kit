import { sql } from 'drizzle-orm';
import type { ResetResult } from '@/dialects/result.types';
import type { PostgresConnection } from './types.postgres';
import { getSchemas, getTables } from './utils.postgres';

/**
 * Resets PostgreSQL database by dropping all user tables and schemas
 */
export async function resetPostgresDatabase(
  connection: PostgresConnection
): Promise<ResetResult> {
  const tablesDropped: string[] = [];

  try {
    const tables = await getTables(connection);
    console.log('Tables to drop:', tables.join(', '));
    for (const table of tables) {
      const dropStatement = sql`DROP TABLE IF EXISTS ${sql.identifier(table)} CASCADE`;
      await connection.db.execute(dropStatement);
      tablesDropped.push(table);
      console.log(`Dropped table: ${table}`);
    }

    const schemas = await getSchemas(connection);
    console.log('Schemas to drop:', schemas.join(', '));
    for (const schema of schemas) {
      if (schema !== 'public') {
        const dropStatement = sql`DROP SCHEMA IF EXISTS ${sql.identifier(schema)} CASCADE`;
        await connection.db.execute(dropStatement);
        tablesDropped.push(`schema:${schema}`);
        console.log(`Dropped schema: ${schema}`);
      }
    }

    console.log('Schema reset completed');
    return {
      success: true,
      tablesDropped,
    };
  } catch (e) {
    console.error('Error resetting schema:', e);
    throw e;
  }
}
