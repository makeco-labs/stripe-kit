import type { ConnectionOptions } from 'node:tls';
import type { Config } from 'drizzle-kit';
import type { AwsDataApiPgDatabase } from 'drizzle-orm/aws-data-api/pg';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { VercelPgDatabase } from 'drizzle-orm/vercel-postgres';

// ========================================================================
// POSTGRES CONNECTION INTERFACE
// ========================================================================

/**
 * PostgreSQL database connection interface
 */
export interface PostgresConnection {
  db:
    | AwsDataApiPgDatabase<Record<string, never>>
    | PgliteDatabase<Record<string, never>>
    | NodePgDatabase<Record<string, never>>
    | PostgresJsDatabase<Record<string, never>>
    | VercelPgDatabase<Record<string, never>>
    | NeonDatabase<Record<string, never>>;
}

// ========================================================================
// POSTGRES CREDENTIAL PRIMITIVES
// ========================================================================

export type PostgresHostSsl =
  | 'require'
  | 'allow'
  | 'prefer'
  | 'verify-full'
  | boolean
  | ConnectionOptions;

/**
 * Host-based PostgreSQL connection credentials
 */
export interface PostgresHostCredentials {
  host: string;
  port?: number;
  user?: string;
  password?: string;
  database: string;
  ssl?: PostgresHostSsl;
}

/**
 * URL-based PostgreSQL connection credentials
 */
export interface PostgresUrlCredentials {
  url: string;
}

/**
 * AWS Data API PostgreSQL credentials
 */
export interface PostgresAwsDataApiCredentials {
  driver: 'aws-data-api';
  database: string;
  secretArn: string;
  resourceArn: string;
}

/**
 * PGLite PostgreSQL credentials
 */
export interface PostgresPgliteCredentials {
  driver: 'pglite';
  url: string;
}

/**
 * All PostgreSQL connection credentials (composable union)
 */
export type PostgresCredentials =
  | PostgresHostCredentials
  | PostgresUrlCredentials
  | PostgresAwsDataApiCredentials
  | PostgresPgliteCredentials;

// ========================================================================
// POSTGRES DRIZZLE CONFIG TYPES
// ========================================================================

export type PostgresConfigWithHost = Config & {
  dialect: 'postgresql';
  dbCredentials: PostgresHostCredentials;
};

export type PostgresConfigWithUrl = Config & {
  dialect: 'postgresql';
  dbCredentials: PostgresUrlCredentials;
};

export type PostgresConfigAwsDataApi = Config & {
  dialect: 'postgresql';
  dbCredentials: PostgresAwsDataApiCredentials;
};

export type PostgresConfigPglite = Config & {
  dialect: 'postgresql';
  dbCredentials: PostgresPgliteCredentials;
};

/**
 * Union of all PostgreSQL config types
 */
export type PostgresConfig =
  | PostgresConfigWithHost
  | PostgresConfigWithUrl
  | PostgresConfigAwsDataApi
  | PostgresConfigPglite;
