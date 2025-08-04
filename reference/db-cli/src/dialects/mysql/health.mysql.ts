import { sql } from 'drizzle-orm';
import type { HealthCheckResult } from '@/dialects/result.types';
import type { MysqlConnection } from './types.mysql';
import { formatMysqlVersion } from './utils.mysql';

/**
 * Checks MySQL database connection
 */
export async function checkMysqlConnection(
  connection: MysqlConnection
): Promise<HealthCheckResult> {
  try {
    // Get MySQL version
    const version = await connection.db.execute(
      sql`SELECT VERSION() AS version`
    );
    const versionString = version[0][0]?.version as string;
    const formattedVersion = versionString
      ? formatMysqlVersion(versionString)
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
    // console.error(`MySQL connection failed: ${message}`);

    return {
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
