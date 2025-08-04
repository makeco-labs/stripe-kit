import type { Config as DrizzleConfig } from 'drizzle-kit';
import type {
  PostgresConfig,
  PostgresConfigAwsDataApi,
  PostgresConfigPglite,
  PostgresConfigWithHost,
  PostgresConfigWithUrl,
  PostgresCredentials,
} from './types.postgres';

// ========================================================================
// POSTGRES TYPE GUARDS
// ========================================================================

export function isPostgresConfig(
  config: DrizzleConfig
): config is PostgresConfig {
  return config.dialect === 'postgresql';
}

export function isPostgresConfigWithHost(
  config: DrizzleConfig
): config is PostgresConfigWithHost {
  return (
    config.dialect === 'postgresql' &&
    !('driver' in config) &&
    'dbCredentials' in config &&
    'host' in config.dbCredentials
  );
}

export function isPostgresConfigWithUrl(
  config: DrizzleConfig
): config is PostgresConfigWithUrl {
  return (
    config.dialect === 'postgresql' &&
    !('driver' in config) &&
    'dbCredentials' in config &&
    'url' in config.dbCredentials &&
    !('host' in config.dbCredentials)
  );
}

export function isPostgresConfigAwsDataApi(
  config: DrizzleConfig
): config is PostgresConfigAwsDataApi {
  return (
    config.dialect === 'postgresql' &&
    'driver' in config &&
    config.driver === 'aws-data-api'
  );
}

export function isPostgresConfigPglite(
  config: DrizzleConfig
): config is PostgresConfigPglite {
  return (
    config.dialect === 'postgresql' &&
    'driver' in config &&
    config.driver === 'pglite'
  );
}

// ========================================================================
// POSTGRES CREDENTIAL EXTRACTOR
// ========================================================================

export function extractPostgresCredentials(
  config: PostgresConfig
): PostgresCredentials {
  if (isPostgresConfigAwsDataApi(config)) {
    return {
      driver: 'aws-data-api',
      database: config.dbCredentials.database,
      secretArn: config.dbCredentials.secretArn,
      resourceArn: config.dbCredentials.resourceArn,
    };
  }
  if (isPostgresConfigPglite(config)) {
    return {
      driver: 'pglite',
      url: config.dbCredentials.url,
    };
  }
  if (isPostgresConfigWithUrl(config)) {
    return { url: config.dbCredentials.url };
  }
  if (isPostgresConfigWithHost(config)) {
    return {
      host: config.dbCredentials.host,
      port: config.dbCredentials.port,
      user: config.dbCredentials.user,
      password: config.dbCredentials.password,
      database: config.dbCredentials.database,
      ssl: config.dbCredentials.ssl as
        | boolean
        | 'require'
        | 'allow'
        | 'prefer'
        | 'verify-full'
        | Record<string, unknown>
        | undefined,
    };
  }
  throw new Error('Invalid PostgreSQL configuration');
}
