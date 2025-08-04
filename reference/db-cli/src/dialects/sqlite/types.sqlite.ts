import type { Config } from 'drizzle-kit';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';

// ========================================================================
// SQLITE CONNECTION INTERFACE
// ========================================================================

/**
 * SQLite database connection interface
 */
export interface SQLiteConnection {
  db:
    | LibSQLDatabase<Record<string, never>>
    | BetterSQLite3Database<Record<string, never>>
    | SqliteRemoteDatabase<Record<string, never>>;
}

// ========================================================================
// SQLITE CREDENTIAL PRIMITIVES
// ========================================================================

/**
 * Base SQLite URL credentials
 */
export interface SqliteUrlCredentials {
  url: string;
}

/**
 * D1 HTTP credentials for Cloudflare D1
 */
export interface SqliteD1HttpCredentials {
  driver: 'd1-http';
  accountId: string;
  databaseId: string;
  token: string;
}

/**
 * All SQLite connection credentials (composable union)
 */
export type SqliteCredentials = SqliteUrlCredentials | SqliteD1HttpCredentials;

// ========================================================================
// SQLITE DRIZZLE CONFIG TYPES
// ========================================================================

export type SqliteConfigWithUrl = Config & {
  dialect: 'sqlite';
  dbCredentials: SqliteUrlCredentials;
};

export type SqliteConfigD1Http = Config & {
  dialect: 'sqlite';
  driver: 'd1-http';
  dbCredentials: Omit<SqliteD1HttpCredentials, 'driver'>;
};

export type SqliteConfigExpo = Config & {
  dialect: 'sqlite';
  driver: 'expo';
};

export type SqliteConfigDurable = Config & {
  dialect: 'sqlite';
  driver: 'durable-sqlite';
};

/**
 * Union of all SQLite config types
 */
export type SqliteConfig =
  | SqliteConfigWithUrl
  | SqliteConfigD1Http
  | SqliteConfigExpo
  | SqliteConfigDurable;
