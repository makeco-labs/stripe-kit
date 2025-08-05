import type Stripe from 'stripe';

import type { Config, StripeMappers } from './config.schemas';
import type { DatabaseAdapter } from './database-adapter.schemas';

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
  stripeClient: Stripe;
  config: Config;
}