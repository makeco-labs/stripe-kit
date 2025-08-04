import { sql } from 'drizzle-orm';
import type { HealthCheckResult } from '@/dialects/result.types';
import type { GelConnection } from './types.gel';
import { formatGelVersion } from './utils.gel';

/**
 * Checks Gel database connection
 */
export async function checkGelConnection(
  connection: GelConnection
): Promise<HealthCheckResult> {
  try {
    // Get Gel version (this is a placeholder - actual implementation may vary)
    const version = await connection.db.execute(
      sql`SELECT VERSION() AS version`
    );
    const versionString = (version[0]?.version as string) || 'Gel Database';
    const formattedVersion = versionString
      ? formatGelVersion(versionString)
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
    // console.error(`Gel connection failed: ${message}`);

    return {
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
