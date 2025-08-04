import type { Config } from './schemas';
import { configSchema } from './schemas';

/**
 * Defines a type-safe Stripe Sync configuration object
 * @param config - The configuration object
 * @returns The validated configuration
 */
export function defineConfig(config: Config): Config {
  // Validate the configuration at runtime
  const validatedConfig = configSchema.parse(config);
  return validatedConfig;
}
