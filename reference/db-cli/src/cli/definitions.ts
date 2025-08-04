import type { Prettify } from '@/types';

// ========================================================================
// CLI ACTION DEFINITIONS
// ========================================================================

/**
 * Available CLI actions as const for type safety
 */
export const ACTIONS = {
  GENERATE: 'generate',
  MIGRATE: 'migrate',
  STUDIO: 'studio',
  DROP: 'drop',
  PUSH: 'push',
  RESET: 'reset',
  REFRESH: 'refresh',
  HEALTH: 'health',
  SEED: 'seed',
  TRUNCATE: 'truncate',
  LIST: 'list',
  LS: 'ls',
} as const;

/**
 * Array of valid action values for validation
 */
export const VALID_ACTIONS = Object.values(ACTIONS);

/**
 * Type derived from the ACTIONS const
 */
export type ActionKey = (typeof ACTIONS)[keyof typeof ACTIONS];

// ========================================================================
// ENVIRONMENT DEFINITIONS
// ========================================================================

/**
 * Available environments as const for type safety
 */
export const ENVIRONMENTS = {
  DEV: 'dev',
  TEST: 'test',
  STAGING: 'staging',
  PROD: 'prod',
} as const;

/**
 * Array of valid environment values for validation
 */
export const VALID_ENVIRONMENTS = Object.values(ENVIRONMENTS);

/**
 * Type derived from the ENVIRONMENTS const
 */
export type EnvironmentKey = (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS];

// ========================================================================
// ACTION DESCRIPTIONS
// ========================================================================

/**
 * Descriptions for each action used in CLI prompts
 */
export const ACTION_DESCRIPTIONS: Record<ActionKey, string> = {
  [ACTIONS.GENERATE]: '[generate]: Generate new migrations',
  [ACTIONS.MIGRATE]: '[migrate]: Apply migrations',
  [ACTIONS.STUDIO]: '[studio]: Open Drizzle Studio',
  [ACTIONS.DROP]: '[drop]: Drop migrations folder',
  [ACTIONS.PUSH]: '[push]: Push schema changes',
  [ACTIONS.RESET]: '[reset]: Reset database data',
  [ACTIONS.REFRESH]:
    '[refresh]: Refresh database (drop + generate + reset + migrate)',
  [ACTIONS.HEALTH]: '[health]: Check database connection and health',
  [ACTIONS.SEED]: '[seed]: Seed database with initial data',
  [ACTIONS.TRUNCATE]:
    '[truncate]: Truncate database (delete data, keep structure)',
  [ACTIONS.LIST]: '[list]: List database tables and schemas',
  [ACTIONS.LS]: '[ls]: List database tables and schemas (alias for list)',
} as const;

// ========================================================================
// CLI OPTIONS TYPE
// ========================================================================

/**
 * CLI options interface for commander action callback
 */
export type CliOptions = Prettify<{
  config?: string;
  env?: EnvironmentKey;
  count?: boolean;
  l?: boolean;
  compact?: boolean;
}>;
