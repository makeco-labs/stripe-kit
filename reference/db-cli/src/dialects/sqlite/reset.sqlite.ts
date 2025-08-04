import { sql } from 'drizzle-orm';
import type { ResetResult } from '@/dialects/result.types';
import type { SQLiteConnection } from './types.sqlite';
import { getTables } from './utils.sqlite';

/**
 * Resets SQLite database by dropping all user tables
 */
export async function resetSqliteDatabase(
  connection: SQLiteConnection
): Promise<ResetResult> {
  const tablesDropped: string[] = [];

  try {
    // Turn off foreign key checks
    await connection.db.run(sql`PRAGMA foreign_keys = OFF`);
    console.log('Foreign keys disabled');

    const tables = await getTables(connection); // Get all table names
    console.log('Tables to drop:', tables.join(', '));
    for (const table of tables) {
      const dropStatement = sql`DROP TABLE IF EXISTS ${sql.identifier(table)}`;
      await connection.db.run(dropStatement); // Drop each table
      tablesDropped.push(table);
      console.log(`Dropped table: ${table}`);
    }

    // Turn foreign key checks back on
    await connection.db.run(sql`PRAGMA foreign_keys = ON`);
    console.log('Foreign keys enabled');

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
