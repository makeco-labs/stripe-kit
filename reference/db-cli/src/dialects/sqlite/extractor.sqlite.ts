import type { Config as DrizzleConfig } from 'drizzle-kit';

import type {
  SqliteConfig,
  SqliteConfigD1Http,
  SqliteConfigDurable,
  SqliteConfigExpo,
  SqliteConfigWithUrl,
  SqliteCredentials,
} from './types.sqlite';

// ========================================================================
// SQLITE TYPE GUARDS
// ========================================================================

/**
 * Type guard for SQLite configs
 */
export function isSqliteConfig(config: DrizzleConfig): config is SqliteConfig {
  return config.dialect === 'sqlite';
}

/**
 * Type guard for SQLite config with URL
 */
export function isSqliteConfigWithUrl(
  config: DrizzleConfig
): config is SqliteConfigWithUrl {
  return (
    config.dialect === 'sqlite' &&
    !('driver' in config) &&
    'dbCredentials' in config
  );
}

/**
 * Type guard for SQLite config with D1 HTTP driver
 */
export function isSqliteConfigD1Http(
  config: DrizzleConfig
): config is SqliteConfigD1Http {
  return (
    config.dialect === 'sqlite' &&
    'driver' in config &&
    config.driver === 'd1-http'
  );
}

/**
 * Type guard for SQLite config with Expo driver
 */
export function isSqliteConfigExpo(
  config: DrizzleConfig
): config is SqliteConfigExpo {
  return (
    config.dialect === 'sqlite' &&
    'driver' in config &&
    config.driver === 'expo'
  );
}

/**
 * Type guard for SQLite config with Durable driver
 */
export function isSqliteConfigDurable(
  config: DrizzleConfig
): config is SqliteConfigDurable {
  return (
    config.dialect === 'sqlite' &&
    'driver' in config &&
    config.driver === 'durable-sqlite'
  );
}

// ========================================================================
// SQLITE CREDENTIAL EXTRACTION
// ========================================================================

/**
 * Extracts SQLite credentials from a SQLite config
 */
export function extractSqliteCredentials(
  config: SqliteConfig
): SqliteCredentials {
  if (isSqliteConfigD1Http(config)) {
    return {
      driver: 'd1-http',
      accountId: config.dbCredentials.accountId,
      databaseId: config.dbCredentials.databaseId,
      token: config.dbCredentials.token,
    };
  }

  if (isSqliteConfigExpo(config)) {
    throw new Error('Driver expo is not yet supported');
  }

  if (isSqliteConfigDurable(config)) {
    throw new Error('Driver durable-sqlite is not yet supported');
  }

  if (isSqliteConfigWithUrl(config)) {
    return { url: config.dbCredentials.url };
  }

  throw new Error('Invalid SQLite configuration');
}
