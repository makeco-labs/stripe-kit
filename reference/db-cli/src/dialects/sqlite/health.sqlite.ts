import { sql } from 'drizzle-orm';
import type { HealthCheckResult } from '@/dialects/result.types';
import type { SQLiteConnection } from './types.sqlite';
import { formatSqliteVersion } from './utils.sqlite';

/**
 * Checks SQLite database connection
 */
export async function checkSqliteConnection(
  connection: SQLiteConnection
): Promise<HealthCheckResult> {
  try {
    // Get SQLite version
    const version = await connection.db.all(
      sql`SELECT sqlite_version() AS version`
    );
    const versionString = (version as Array<{ version: string }>)[0]?.version;
    const formattedVersion = versionString
      ? formatSqliteVersion(versionString)
      : undefined;

    // Perform a simple health check query
    await connection.db.run(sql`SELECT 1`);

    // console.log(`SQLite connection successful: ${versionString}`);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: formattedVersion,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Database connection failed';
    console.error(`SQLite connection failed: ${message}`);

    return {
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
