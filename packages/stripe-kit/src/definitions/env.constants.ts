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
