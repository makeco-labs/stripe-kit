import { sql } from 'drizzle-orm';
import type { ResetResult } from '@/dialects/result.types';
import type { MysqlConnection } from './types.mysql';
import { getTables } from './utils.mysql';

/**
 * Resets MySQL database by dropping all user tables while preserving system tables
 * and migration history tables
 */
export async function resetMysqlDatabase(
  connection: MysqlConnection
): Promise<ResetResult> {
  const tablesDropped: string[] = [];

  try {
    // Disable foreign key checks
    await connection.db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
    console.log('Foreign key checks disabled');

    const tables = await getTables(connection);
    console.log('Tables to drop:', tables.join(', '));

    // Drop tables (MySQL allows CASCADE behavior with foreign key checks disabled)
    for (const table of tables) {
      const dropStatement = sql`DROP TABLE IF EXISTS ${sql.identifier(table)}`;
      await connection.db.execute(dropStatement);
      tablesDropped.push(table);
      console.log(`Dropped table: ${table}`);
    }

    // Re-enable foreign key checks
    await connection.db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
    console.log('Foreign key checks enabled');

    console.log('Database reset completed');
    return {
      success: true,
      tablesDropped,
    };
  } catch (e) {
    console.error('Error resetting database:', e);
    // Try to restore foreign key checks in case of error
    try {
      await connection.db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
    } catch (restoreError) {
      console.error('Error restoring foreign key checks:', restoreError);
    }
    throw e;
  }
}
