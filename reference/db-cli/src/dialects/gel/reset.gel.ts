import { sql } from 'drizzle-orm';
import type { ResetResult } from '@/dialects/result.types';
import type { GelConnection } from './types.gel';
import { getTables } from './utils.gel';

/**
 * Resets Gel database by dropping all user tables while preserving system tables
 * and migration history tables
 */
export async function resetGelDatabase(
  connection: GelConnection
): Promise<ResetResult> {
  const tablesDropped: string[] = [];

  try {
    const tables = await getTables(connection);
    console.log('Tables to drop:', tables.join(', '));

    // Drop tables (implementation may vary based on Gel's transaction/constraint handling)
    for (const table of tables) {
      try {
        const dropStatement = sql`DROP TABLE IF EXISTS ${sql.identifier(table)}`;
        await connection.db.execute(dropStatement);
        tablesDropped.push(table);
        console.log(`Dropped table: ${table}`);
      } catch (error) {
        console.warn(`Failed to drop table ${table}:`, error);
        // Continue with other tables
      }
    }

    console.log('Database reset completed');
    return {
      success: true,
      tablesDropped,
    };
  } catch (e) {
    console.error('Error resetting database:', e);
    throw e;
  }
}
