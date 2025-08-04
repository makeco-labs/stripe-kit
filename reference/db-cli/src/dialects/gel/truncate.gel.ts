import { sql } from 'drizzle-orm';
import type { TruncateResult } from '@/dialects/result.types';
import type { GelConnection } from './types.gel';
import { getTables } from './utils.gel';

/**
 * Truncates Gel database by deleting all data from user tables while preserving table structure
 */
export async function truncateGelDatabase(
  connection: GelConnection
): Promise<TruncateResult> {
  const tablesTruncated: string[] = [];

  try {
    const tables = await getTables(connection);
    console.log('Tables to truncate:', tables.join(', '));

    for (const table of tables) {
      try {
        // Try TRUNCATE first, fall back to DELETE if not supported
        try {
          const truncateStatement = sql`TRUNCATE TABLE ${sql.identifier(table)}`;
          await connection.db.execute(truncateStatement);
        } catch {
          // Fallback to DELETE if TRUNCATE is not supported
          const deleteStatement = sql`DELETE FROM ${sql.identifier(table)}`;
          await connection.db.execute(deleteStatement);
        }

        tablesTruncated.push(table);
        console.log(`Truncated table: ${table}`);
      } catch (error) {
        console.warn(`Failed to truncate table ${table}:`, error);
        // Continue with other tables
      }
    }

    console.log('Database truncate completed');
    return {
      success: true,
      tablesTruncated,
    };
  } catch (e) {
    console.error('Error truncating database:', e);
    throw e;
  }
}
