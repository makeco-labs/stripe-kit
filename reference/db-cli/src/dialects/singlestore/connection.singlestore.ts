import { checkPackage } from '../../utils';
import type {
  SingleStoreConnection,
  SingleStoreCredentials,
} from './types.singlestore';

// ========================================================================
// CONNECTION FUNCTIONS
// ========================================================================

/**
 * Prepares a SingleStore database connection using mysql2 driver
 * SingleStore is MySQL-compatible and uses the same driver
 */
export async function prepareSingleStoreDB(
  credentials: SingleStoreCredentials
): Promise<SingleStoreConnection> {
  if (await checkPackage('mysql2')) {
    console.log(`Using 'mysql2' driver for SingleStore database querying`);
    const { createConnection } = await import('mysql2/promise');
    const { drizzle } = await import('drizzle-orm/singlestore');

    const connection =
      'url' in credentials
        ? await createConnection(credentials.url)
        : await createConnection({
            host: credentials.host,
            port: credentials.port,
            user: credentials.user,
            password: credentials.password,
            database: credentials.database,
            ssl: credentials.ssl,
          });

    const db = drizzle(connection);
    return { db };
  }

  throw new Error(
    "Please install 'mysql2' for Drizzle Kit to connect to SingleStore databases"
  );
}
