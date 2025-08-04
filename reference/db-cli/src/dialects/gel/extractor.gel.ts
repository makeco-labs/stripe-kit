import type { Config as DrizzleConfig } from 'drizzle-kit';

import type {
  GelConfig,
  GelConfigBasic,
  GelConfigWithHost,
  GelConfigWithUrl,
  GelCredentials,
} from './types.gel';

// ========================================================================
// GEL TYPE GUARDS
// ========================================================================

/**
 * Type guard for Gel configs
 */
export function isGelConfig(config: DrizzleConfig): config is GelConfig {
  return config.dialect === 'gel';
}

/**
 * Type guard for Gel config with host
 */
export function isGelConfigWithHost(
  config: DrizzleConfig
): config is GelConfigWithHost {
  return (
    config.dialect === 'gel' &&
    'dbCredentials' in config &&
    !!config.dbCredentials &&
    'host' in config.dbCredentials
  );
}

/**
 * Type guard for Gel config with URL
 */
export function isGelConfigWithUrl(
  config: DrizzleConfig
): config is GelConfigWithUrl {
  return (
    config.dialect === 'gel' &&
    'dbCredentials' in config &&
    !!config.dbCredentials &&
    'url' in config.dbCredentials &&
    !('host' in config.dbCredentials)
  );
}

/**
 * Type guard for basic Gel config
 */
export function isGelConfigBasic(
  config: DrizzleConfig
): config is GelConfigBasic {
  return (
    config.dialect === 'gel' &&
    !('dbCredentials' in config && config.dbCredentials)
  );
}

// ========================================================================
// GEL CREDENTIAL EXTRACTION
// ========================================================================

/**
 * Extracts Gel credentials from a Gel config
 */
export function extractGelCredentials(config: GelConfig): GelCredentials {
  if (isGelConfigWithHost(config)) {
    return {
      host: config.dbCredentials.host,
      port: config.dbCredentials.port,
      user: config.dbCredentials.user,
      password: config.dbCredentials.password,
      database: config.dbCredentials.database,
      tlsSecurity: config.dbCredentials.tlsSecurity,
    };
  }

  if (isGelConfigWithUrl(config)) {
    return {
      url: config.dbCredentials.url,
      tlsSecurity: config.dbCredentials.tlsSecurity,
    };
  }

  if (isGelConfigBasic(config)) {
    return {};
  }

  throw new Error('Invalid Gel configuration');
}
