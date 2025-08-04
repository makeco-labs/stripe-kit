import { sql } from 'drizzle-orm';
import type { HealthCheckResult } from '@/dialects/result.types';
import type { TursoConnection } from './types.turso';
import { formatTursoVersion } from './utils.turso';

/**
 * Checks Turso database connection
 */
export async function checkTursoConnection(
  connection: TursoConnection
): Promise<HealthCheckResult> {
  try {
    // Get SQLite version (Turso is built on LibSQL which is SQLite-compatible)
    const version = await connection.db.all(
      sql`SELECT sqlite_version() AS version`
    );
    const versionString = (version as Array<{ version: string }>)[0]?.version;
    const formattedVersion = versionString
      ? formatTursoVersion(versionString)
      : undefined;

    // Perform a simple health check query
    await connection.db.run(sql`SELECT 1`);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: formattedVersion,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Database connection failed';
    // console.error(`Turso connection failed: ${message}`);

    return {
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
