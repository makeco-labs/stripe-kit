import type { Config } from 'drizzle-kit';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { PlanetScaleDatabase } from 'drizzle-orm/planetscale-serverless';

// ========================================================================
// MYSQL CONNECTION INTERFACE
// ========================================================================

/**
 * MySQL database connection interface
 */
export interface MysqlConnection {
  db:
    | MySql2Database<Record<string, never>>
    | PlanetScaleDatabase<Record<string, never>>;
}

// ========================================================================
// MYSQL CREDENTIAL PRIMITIVES
// ========================================================================

/**
 * MySQL SSL configuration
 */
export type MysqlSsl =
  | string
  | {
      pfx?: string;
      key?: string;
      passphrase?: string;
      cert?: string;
      ca?: string | string[];
      crl?: string | string[];
      ciphers?: string;
      rejectUnauthorized?: boolean;
    };

/**
 * Host-based MySQL connection credentials
 */
export interface MysqlHostCredentials {
  host: string;
  port?: number;
  user?: string;
  password?: string;
  database: string;
  ssl?: MysqlSsl;
}

/**
 * URL-based MySQL connection credentials
 */
export interface MysqlUrlCredentials {
  url: string;
}

/**
 * All MySQL connection credentials (composable union)
 */
export type MysqlCredentials = MysqlHostCredentials | MysqlUrlCredentials;

// ========================================================================
// MYSQL DRIZZLE CONFIG TYPES
// ========================================================================

export type MysqlConfigWithHost = Config & {
  dialect: 'mysql';
  dbCredentials: MysqlHostCredentials;
};

export type MysqlConfigWithUrl = Config & {
  dialect: 'mysql';
  dbCredentials: MysqlUrlCredentials;
};

/**
 * Union of all MySQL config types
 */
export type MysqlConfig = MysqlConfigWithHost | MysqlConfigWithUrl;
