import { sql } from 'drizzle-orm';
import type { TruncateResult } from '@/dialects/result.types';
import type { MysqlConnection } from './types.mysql';
import { getTables } from './utils.mysql';

/**
 * Truncates MySQL database by deleting all data from user tables while preserving table structure
 */
export async function truncateMysqlDatabase(
  connection: MysqlConnection
): Promise<TruncateResult> {
  const tablesTruncated: string[] = [];

  try {
    // Disable foreign key checks
    await connection.db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
    console.log('Foreign key checks disabled');

    const tables = await getTables(connection);
    console.log('Tables to truncate:', tables.join(', '));

    for (const table of tables) {
      // Use TRUNCATE TABLE for better performance in MySQL
      const truncateStatement = sql`TRUNCATE TABLE ${sql.identifier(table)}`;
      await connection.db.execute(truncateStatement);
      tablesTruncated.push(table);
      console.log(`Truncated table: ${table}`);
    }

    // Re-enable foreign key checks
    await connection.db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
    console.log('Foreign key checks enabled');

    console.log('Database truncate completed');
    return {
      success: true,
      tablesTruncated,
    };
  } catch (e) {
    console.error('Error truncating database:', e);
    // Try to restore foreign key checks in case of error
    try {
      await connection.db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
    } catch (restoreError) {
      console.error('Error restoring foreign key checks:', restoreError);
    }
    throw e;
  }
}
