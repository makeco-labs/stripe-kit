import type { GelConfig, GelConnection } from './dialects/gel';
import type { MysqlConfig, MysqlConnection } from './dialects/mysql';
import type { PostgresConfig, PostgresConnection } from './dialects/postgres';
import type {
  SingleStoreConfig,
  SingleStoreConnection,
} from './dialects/singlestore';
import type { SQLiteConnection, SqliteConfig } from './dialects/sqlite';
import type { TursoConfig, TursoConnection } from './dialects/turso';

// ========================================================================
// UTILITY TYPES
// ========================================================================

/**
 * Utility type to flatten and display the internals of complex types
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// ========================================================================
// DB-CLI CONFIGURATION
// ========================================================================

export interface DbConfig {
  drizzleConfig: string; // Path to drizzle.config.ts
  seed?: string; // Optional path to seed file
}

/**
 * Helper function to define db-cli configuration with type safety
 */
export function defineConfig(config: DbConfig): DbConfig {
  return config;
}

// ========================================================================
// DATABASE CONNECTION UNIONS
// ========================================================================

export type DatabaseConnection =
  | PostgresConnection
  | SQLiteConnection
  | MysqlConnection
  | TursoConnection
  | SingleStoreConnection
  | GelConnection;

// ========================================================================
// SUPPORTED CONFIG TYPES
// ========================================================================

// Supported config type (union of all dialect configs)
export type SupportedConfig =
  | PostgresConfig
  | SqliteConfig
  | MysqlConfig
  | TursoConfig
  | SingleStoreConfig
  | GelConfig;
