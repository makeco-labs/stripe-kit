import type { Config } from 'drizzle-kit';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';

// ========================================================================
// TURSO CONNECTION INTERFACE
// ========================================================================

/**
 * Turso database connection interface
 */
export interface TursoConnection {
  db: LibSQLDatabase<Record<string, never>>;
}

// ========================================================================
// TURSO CREDENTIAL PRIMITIVES
// ========================================================================

/**
 * Turso connection credentials
 */
export interface TursoCredentials {
  url: string;
  authToken?: string;
}

// ========================================================================
// TURSO DRIZZLE CONFIG TYPES
// ========================================================================

/**
 * Turso-specific config type
 */
export type TursoConfig = Config & {
  dialect: 'turso';
  dbCredentials: TursoCredentials;
};
