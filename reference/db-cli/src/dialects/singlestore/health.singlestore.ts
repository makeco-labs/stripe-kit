import { sql } from 'drizzle-orm';
import type { HealthCheckResult } from '@/dialects/result.types';
import type { SingleStoreConnection } from './types.singlestore';
import { formatSingleStoreVersion } from './utils.singlestore';

/**
 * Checks SingleStore database connection
 */
export async function checkSingleStoreConnection(
  connection: SingleStoreConnection
): Promise<HealthCheckResult> {
  try {
    // Get SingleStore version
    const version = await connection.db.execute(
      sql`SELECT VERSION() AS version`
    );
    const versionString = version[0][0]?.version as string;
    const formattedVersion = versionString
      ? formatSingleStoreVersion(versionString)
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
    // console.error(`SingleStore connection failed: ${message}`);

    return {
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
