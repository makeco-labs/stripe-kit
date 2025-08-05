import type { Prettify } from '@/types';

// ========================================================================
// CLI ACTION DEFINITIONS
// ========================================================================

/**
 * Available CLI actions as const for type safety
 */
export const ACTIONS = {
  CREATE: 'create',
  ARCHIVE: 'archive',
  SYNC: 'sync',
  UPDATE: 'update',
  CLEAR_DB_PLANS: 'clear-db-plans',
  URL: 'url',
  LIST_PRODUCTS: 'list-products',
  LIST_PRICES: 'list-prices',
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
  TEST: 'test',
  DEV: 'dev',
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
  [ACTIONS.CREATE]: '[create]: Create Stripe subscription plans (Idempotent)',
  [ACTIONS.ARCHIVE]: '[archive]: Archive Stripe subscription plans',
  [ACTIONS.SYNC]: '[sync]: Sync Stripe subscription plans to database',
  [ACTIONS.UPDATE]: '[update]: Update Stripe subscription plans',
  [ACTIONS.CLEAR_DB_PLANS]:
    '[clear-db-plans]: Delete subscription plans from database',
  [ACTIONS.URL]: '[url]: Show Stripe dashboard URL',
  [ACTIONS.LIST_PRODUCTS]: '[list-products]: List Stripe products',
  [ACTIONS.LIST_PRICES]: '[list-prices]: List Stripe prices',
} as const;

// ========================================================================
// ACTION REQUIREMENTS
// ========================================================================

/**
 * Defines which inputs each action requires
 */
export const ACTION_REQUIREMENTS: Record<
  ActionKey,
  { needsEnv: boolean; needsAdapter: boolean }
> = {
  [ACTIONS.CREATE]: { needsEnv: true, needsAdapter: false },
  [ACTIONS.ARCHIVE]: { needsEnv: true, needsAdapter: false },
  [ACTIONS.SYNC]: { needsEnv: true, needsAdapter: true },
  [ACTIONS.UPDATE]: { needsEnv: true, needsAdapter: false },
  [ACTIONS.CLEAR_DB_PLANS]: { needsEnv: true, needsAdapter: true },
  [ACTIONS.URL]: { needsEnv: false, needsAdapter: false },
  [ACTIONS.LIST_PRODUCTS]: { needsEnv: true, needsAdapter: false },
  [ACTIONS.LIST_PRICES]: { needsEnv: true, needsAdapter: false },
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
  adapter?: string;
  all?: boolean;
}>;
