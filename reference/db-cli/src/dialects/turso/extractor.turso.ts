import type { Config as DrizzleConfig } from 'drizzle-kit';

import type { TursoConfig, TursoCredentials } from './types.turso';

// ========================================================================
// TURSO TYPE GUARDS
// ========================================================================

/**
 * Type guard for Turso config
 */
export function isTursoConfig(config: DrizzleConfig): config is TursoConfig {
  return config.dialect === 'turso';
}

// ========================================================================
// TURSO CREDENTIAL EXTRACTION
// ========================================================================

/**
 * Extracts Turso credentials from a Turso config
 */
export function extractTursoCredentials(config: TursoConfig): TursoCredentials {
  return {
    url: config.dbCredentials.url,
    authToken: config.dbCredentials.authToken,
  };
}
