import { checkPackage } from '../../utils';
import type { MysqlConnection, MysqlCredentials } from './types.mysql';

// ========================================================================
// CONNECTION FUNCTIONS
// ========================================================================

/**
 * Prepares a MySQL database connection using available drivers
 * Supports mysql2 and @planetscale/database
 */
export async function prepareMysqlDB(
  credentials: MysqlCredentials
): Promise<MysqlConnection> {
  // Try mysql2 first
  if (await checkPackage('mysql2')) {
    console.log(`Using 'mysql2' driver for database querying`);
    const { createConnection } = await import('mysql2/promise');
    const { drizzle } = await import('drizzle-orm/mysql2');

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

  // Try PlanetScale
  if (await checkPackage('@planetscale/database')) {
    console.log(`Using '@planetscale/database' driver for database querying`);
    const { Client } = await import('@planetscale/database');
    const { drizzle } = await import('drizzle-orm/planetscale-serverless');

    if (!('url' in credentials)) {
      throw new Error(
        '@planetscale/database driver only supports URL connections'
      );
    }

    const client = new Client({ url: credentials.url });
    const db = drizzle(client);
    return { db };
  }

  throw new Error(
    "Please install either 'mysql2' or '@planetscale/database' for Drizzle Kit to connect to MySQL databases"
  );
}
