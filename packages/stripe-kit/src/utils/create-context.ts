import type { Config, Context, DatabaseAdapter } from "@/definitions";
import { createLogger } from "./create-logger";
import { createStripeClient } from "./stripe-client";

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

  return {
    logger,
    stripeClient,
    adapter,
    env: process.env,
    config,
  };
}
