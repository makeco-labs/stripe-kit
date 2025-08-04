import type { Config } from 'drizzle-kit';

// Placeholder type for Gel database until it's available in drizzle-orm
type GelDatabase<T extends Record<string, never> = Record<string, never>> = {
  _: 'GelDatabase';
  schema: T;
  execute: (query: unknown) => Promise<any>;
};

// ========================================================================
// GEL CONNECTION INTERFACE
// ========================================================================

/**
 * Gel database connection interface
 */
export interface GelConnection {
  db: GelDatabase<Record<string, never>>;
}

// ========================================================================
// GEL CREDENTIAL PRIMITIVES
// ========================================================================

/**
 * Gel TLS security options
 */
export type GelTlsSecurity =
  | 'insecure'
  | 'no_host_verification'
  | 'strict'
  | 'default';

/**
 * Host-based Gel connection credentials
 */
export interface GelHostCredentials {
  host: string;
  port?: number;
  user?: string;
  password?: string;
  database: string;
  tlsSecurity?: GelTlsSecurity;
}

/**
 * URL-based Gel connection credentials
 */
export interface GelUrlCredentials {
  url: string;
  tlsSecurity?: GelTlsSecurity;
}

/**
 * Basic Gel credentials (no connection details needed)
 */
export type GelBasicCredentials = Record<string, unknown>;

/**
 * All Gel connection credentials (composable union)
 */
export type GelCredentials =
  | GelHostCredentials
  | GelUrlCredentials
  | GelBasicCredentials;

// ========================================================================
// GEL DRIZZLE CONFIG TYPES
// ========================================================================

export type GelConfigWithHost = Config & {
  dialect: 'gel';
  dbCredentials: GelHostCredentials;
};

export type GelConfigWithUrl = Config & {
  dialect: 'gel';
  dbCredentials: GelUrlCredentials;
};

export type GelConfigBasic = Config & {
  dialect: 'gel';
  dbCredentials?: undefined;
};

/**
 * Union of all Gel config types
 */
export type GelConfig = GelConfigWithHost | GelConfigWithUrl | GelConfigBasic;
