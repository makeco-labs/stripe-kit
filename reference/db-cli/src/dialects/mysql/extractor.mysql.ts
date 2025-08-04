import type { Config as DrizzleConfig } from 'drizzle-kit';

import type {
  MysqlConfig,
  MysqlConfigWithHost,
  MysqlConfigWithUrl,
  MysqlCredentials,
} from './types.mysql';

// ========================================================================
// MYSQL TYPE GUARDS
// ========================================================================

/**
 * Type guard for MySQL configs
 */
export function isMysqlConfig(config: DrizzleConfig): config is MysqlConfig {
  return config.dialect === 'mysql';
}

/**
 * Type guard for MySQL config with host
 */
export function isMysqlConfigWithHost(
  config: DrizzleConfig
): config is MysqlConfigWithHost {
  return (
    config.dialect === 'mysql' &&
    'dbCredentials' in config &&
    'host' in config.dbCredentials
  );
}

/**
 * Type guard for MySQL config with URL
 */
export function isMysqlConfigWithUrl(
  config: DrizzleConfig
): config is MysqlConfigWithUrl {
  return (
    config.dialect === 'mysql' &&
    'dbCredentials' in config &&
    'url' in config.dbCredentials &&
    !('host' in config.dbCredentials)
  );
}

// ========================================================================
// MYSQL CREDENTIAL EXTRACTION
// ========================================================================

/**
 * Extracts MySQL credentials from a MySQL config
 */
export function extractMysqlCredentials(config: MysqlConfig): MysqlCredentials {
  if (isMysqlConfigWithUrl(config)) {
    return { url: config.dbCredentials.url };
  }

  if (isMysqlConfigWithHost(config)) {
    return {
      host: config.dbCredentials.host,
      port: config.dbCredentials.port,
      user: config.dbCredentials.user,
      password: config.dbCredentials.password,
      database: config.dbCredentials.database,
      ssl: config.dbCredentials.ssl,
    };
  }

  throw new Error('Invalid MySQL configuration');
}
