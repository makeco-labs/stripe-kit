import { sql } from 'drizzle-orm';

import type { TruncateResult } from '@/dialects/result.types';
import type { SQLiteConnection } from './types.sqlite';
import { getTables } from './utils.sqlite';

/**
 * Truncates SQLite database by deleting all data from user tables while preserving table structure
 */
export async function truncateSQLiteDatabase(
  connection: SQLiteConnection
): Promise<TruncateResult> {
  const tablesTruncated: string[] = [];

  try {
    // Turn off foreign key checks
    connection.db.run(sql`PRAGMA foreign_keys = OFF`);
    console.log('Foreign keys disabled');

    const tables = await getTables(connection); // Get all table names
    console.log('Tables to truncate:', tables.join(', '));

    for (const table of tables) {
      // Use DELETE instead of TRUNCATE since SQLite doesn't support TRUNCATE
      const deleteStatement = sql`DELETE FROM ${sql.identifier(table)}`;
      connection.db.run(deleteStatement); // Delete all data from table
      tablesTruncated.push(table);
      console.log(`Truncated table: ${table}`);
    }

    // Reset auto-increment counters
    for (const table of tables) {
      const resetSequenceStatement = sql`DELETE FROM sqlite_sequence WHERE name = ${table}`;
      connection.db.run(resetSequenceStatement);
    }
    console.log('Auto-increment counters reset');

    // Turn foreign key checks back on
    connection.db.run(sql`PRAGMA foreign_keys = ON`);
    console.log('Foreign keys enabled');

    console.log('Database truncate completed');
    return {
      success: true,
      tablesTruncated,
    };
  } catch (e) {
    console.error('Error truncating database:', e);
    // Try to restore foreign key checks in case of error
    try {
      connection.db.run(sql`PRAGMA foreign_keys = ON`);
    } catch (restoreError) {
      console.error('Error restoring foreign key checks:', restoreError);
    }
    throw e;
  }
}
