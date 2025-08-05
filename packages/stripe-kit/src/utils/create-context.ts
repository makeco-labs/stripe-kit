import type { Context } from "@/definitions";
import { createMappers } from "./create-mappers";
import type { Config, DatabaseAdapter } from "@/definitions";
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
