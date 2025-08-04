import { sql } from 'drizzle-orm';
import type { HealthCheckResult } from '@/dialects/result.types';
import type { PostgresConnection } from './types.postgres';
import { formatPostgresVersion } from './utils.postgres';

export type VersionResult = {
  rows: {
    version: string;
  }[];
};

/**
 * Checks PostgreSQL database connection
 */
export async function checkPostgresConnection(
  connection: PostgresConnection
): Promise<HealthCheckResult> {
  try {
    // Get PostgreSQL version
    const version = (await connection.db.execute(
      sql`SELECT version() AS version`
    )) as VersionResult;

    const versionString = version.rows[0]?.version;
    const formattedVersion = versionString
      ? formatPostgresVersion(versionString)
      : undefined;

    // Perform a simple health check query
    await connection.db.execute(sql`SELECT 1`);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: formattedVersion,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Database connection failed';

    return {
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
