import { createLogger, createStripeClient } from '@/utils';
import { createMappers } from '../mappers';

import type { DatabaseAdapter, Config } from '@/config';
import type { Context } from '@/types';

/**
 * Creates the context object for executing stripe operations
 */
export function createContext(input: {
  adapter: DatabaseAdapter;
  config: Config;
}): Context {
  const { adapter, config } = input;

  const logger = createLogger();

  const stripeSecretKey = config.env.stripeSecretKey;

  const stripeClient = createStripeClient({
    STRIPE_SECRET_KEY: stripeSecretKey,
  });

  // Create mappers for Stripe operations
  const mappers = createMappers(config);

  return {
    logger,
    stripeClient,
    mappers,
    adapter,
    env: process.env,
    config,
  };
}