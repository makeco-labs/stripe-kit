import type { Config as DrizzleConfig } from 'drizzle-kit';

import type {
  SingleStoreConfig,
  SingleStoreConfigWithHost,
  SingleStoreConfigWithUrl,
  SingleStoreCredentials,
} from './types.singlestore';

// ========================================================================
// SINGLESTORE TYPE GUARDS
// ========================================================================

/**
 * Type guard for SingleStore configs
 */
export function isSingleStoreConfig(
  config: DrizzleConfig
): config is SingleStoreConfig {
  return config.dialect === 'singlestore';
}

/**
 * Type guard for SingleStore config with host
 */
export function isSingleStoreConfigWithHost(
  config: DrizzleConfig
): config is SingleStoreConfigWithHost {
  return (
    config.dialect === 'singlestore' &&
    'dbCredentials' in config &&
    'host' in config.dbCredentials
  );
}

/**
 * Type guard for SingleStore config with URL
 */
export function isSingleStoreConfigWithUrl(
  config: DrizzleConfig
): config is SingleStoreConfigWithUrl {
  return (
    config.dialect === 'singlestore' &&
    'dbCredentials' in config &&
    'url' in config.dbCredentials &&
    !('host' in config.dbCredentials)
  );
}

// ========================================================================
// SINGLESTORE CREDENTIAL EXTRACTION
// ========================================================================

/**
 * Extracts SingleStore credentials from a SingleStore config
 */
export function extractSingleStoreCredentials(
  config: SingleStoreConfig
): SingleStoreCredentials {
  if (isSingleStoreConfigWithUrl(config)) {
    return { url: config.dbCredentials.url };
  }

  if (isSingleStoreConfigWithHost(config)) {
    return {
      host: config.dbCredentials.host,
      port: config.dbCredentials.port,
      user: config.dbCredentials.user,
      password: config.dbCredentials.password,
      database: config.dbCredentials.database,
      ssl: config.dbCredentials.ssl,
    };
  }

  throw new Error('Invalid SingleStore configuration');
}
