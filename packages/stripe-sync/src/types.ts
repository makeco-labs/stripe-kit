import type Stripe from 'stripe';
import type { StripeMappers, DatabaseAdapter } from './config/config.schemas';

// ========================================================================
// UTILITY TYPES
// ========================================================================

/**
 * Utility type for flattening intersections
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// NOTE: Configuration types have been moved to @/config/config.schemas
// NOTE: DatabaseAdapter has been moved to @/config/config.schemas

// ========================================================================
// CONTEXT TYPES
// ========================================================================

export interface Logger {
  info(message: string | object, ...args: unknown[]): void;
  error(message: string | object, ...args: unknown[]): void;
  warn(message: string | object, ...args: unknown[]): void;
  debug(message: string | object, ...args: unknown[]): void;
}

export interface Context {
  logger: Logger;
  env: Record<string, string | undefined>;
  mappers: StripeMappers;
  adapter: DatabaseAdapter;
}

export interface DatabaseContext extends Context {
  db: unknown;
}

export interface PaymentContext {
  payment: {
    stripeClient: Stripe;
  };
}

export type WithClient<T> = T & PaymentContext;

// ========================================================================
// CLI TYPES
// ========================================================================

export type ActionKey =
  | 'create'
  | 'archive'
  | 'sync'
  | 'update'
  | 'clear-db-plans'
  | 'url'
  | 'list-products'
  | 'list-prices';

export type EnvironmentKey = 'test' | 'dev' | 'staging' | 'prod';

export type DialectKey = 'sqlite' | 'postgres' | 'turso';
