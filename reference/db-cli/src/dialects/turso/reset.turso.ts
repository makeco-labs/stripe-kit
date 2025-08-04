import { sql } from 'drizzle-orm';
import type { ResetResult } from '@/dialects/result.types';
import type { TursoConnection } from './types.turso';
import { getTables } from './utils.turso';

/**
 * Resets Turso database by dropping all user tables while preserving system tables
 * and migration history tables
 */
export async function resetTursoDatabase(
  connection: TursoConnection
): Promise<ResetResult> {
  const tablesDropped: string[] = [];

  try {
    // Turn off foreign key checks
    connection.db.run(sql`PRAGMA foreign_keys = OFF`);
    console.log('Foreign keys disabled');

    const tables = await getTables(connection);
    console.log('Tables to drop:', tables.join(', '));

    // Drop tables in reverse order to handle dependencies
    for (const table of tables.reverse()) {
      const dropStatement = sql`DROP TABLE IF EXISTS ${sql.identifier(table)}`;
      connection.db.run(dropStatement);
      tablesDropped.push(table);
      console.log(`Dropped table: ${table}`);
    }

    // Turn foreign key checks back on
    connection.db.run(sql`PRAGMA foreign_keys = ON`);
    console.log('Foreign keys enabled');

    console.log('Database reset completed');
    return {
      success: true,
      tablesDropped,
    };
  } catch (e) {
    console.error('Error resetting database:', e);
    // Try to restore foreign key checks in case of error
    try {
      connection.db.run(sql`PRAGMA foreign_keys = ON`);
    } catch (restoreError) {
      console.error('Error restoring foreign key checks:', restoreError);
    }
    throw e;
  }
}
