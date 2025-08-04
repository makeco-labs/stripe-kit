import { checkPackage } from '../../utils';
import type { TursoConnection, TursoCredentials } from './types.turso';

// ========================================================================
// CONNECTION FUNCTIONS
// ========================================================================

/**
 * Prepares a Turso database connection using @libsql/client
 */
export async function prepareTursoDB(
  credentials: TursoCredentials
): Promise<TursoConnection> {
  if (await checkPackage('@libsql/client')) {
    console.log(`Using '@libsql/client' driver for Turso database querying`);
    const { createClient } = await import('@libsql/client');
    const { drizzle } = await import('drizzle-orm/libsql');

    const client = createClient({
      url: credentials.url,
      authToken: credentials.authToken,
    });

    const db = drizzle(client);
    return { db };
  }

  throw new Error(
    "Please install '@libsql/client' for Drizzle Kit to connect to Turso databases"
  );
}
