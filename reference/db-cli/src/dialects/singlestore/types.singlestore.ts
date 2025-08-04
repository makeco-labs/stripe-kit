import type { Config } from 'drizzle-kit';
import type { SingleStoreDatabase } from 'drizzle-orm/singlestore';

// ========================================================================
// SINGLESTORE CONNECTION INTERFACE
// ========================================================================

/**
 * SingleStore database connection interface
 */
export interface SingleStoreConnection {
  db: SingleStoreDatabase<any, any, Record<string, never>>;
}

// ========================================================================
// SINGLESTORE CREDENTIAL PRIMITIVES
// ========================================================================

/**
 * SingleStore SSL configuration
 */
export type SingleStoreSsl = string | Record<string, unknown>;

/**
 * Host-based SingleStore connection credentials
 */
export interface SingleStoreHostCredentials {
  host: string;
  port?: number;
  user?: string;
  password?: string;
  database: string;
  ssl?: SingleStoreSsl;
}

/**
 * URL-based SingleStore connection credentials
 */
export interface SingleStoreUrlCredentials {
  url: string;
}

/**
 * All SingleStore connection credentials (composable union)
 */
export type SingleStoreCredentials =
  | SingleStoreHostCredentials
  | SingleStoreUrlCredentials;

// ========================================================================
// SINGLESTORE DRIZZLE CONFIG TYPES
// ========================================================================

export type SingleStoreConfigWithHost = Config & {
  dialect: 'singlestore';
  dbCredentials: SingleStoreHostCredentials;
};

export type SingleStoreConfigWithUrl = Config & {
  dialect: 'singlestore';
  dbCredentials: SingleStoreUrlCredentials;
};

/**
 * Union of all SingleStore config types
 */
export type SingleStoreConfig =
  | SingleStoreConfigWithHost
  | SingleStoreConfigWithUrl;
