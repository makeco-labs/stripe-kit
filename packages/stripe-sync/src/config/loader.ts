import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';

import type { StripeSyncConfig } from './config.schemas';
import { stripeSyncConfigSchema } from './config.schemas';

export async function loadStripeSyncConfig(
  configPath?: string
): Promise<StripeSyncConfig> {
  const cwd = process.cwd();
  const defaultConfigPath = path.join(cwd, 'stripe.config.ts');
  const finalConfigPath = configPath || defaultConfigPath;

  if (!fs.existsSync(finalConfigPath)) {
    throw new Error(`Stripe config file not found at: ${finalConfigPath}`);
  }

  try {
    // Convert to file URL for dynamic import
    const configUrl = pathToFileURL(finalConfigPath).href;
    const configModule = await import(configUrl);

    const config = configModule.default || configModule;

    // Validate the configuration
    const validatedConfig = stripeSyncConfigSchema.parse(config);

    return validatedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // In Zod v4, use the issues property instead of errors
      const errorMessages = error.issues.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      throw new Error(`Invalid stripe.config.ts:\n${errorMessages.join('\n')}`);
    }
    throw new Error(`Failed to load stripe.config.ts: ${error}`);
  }
}

export function getDefaultEnvironments() {
  return {
    test: { envFile: '.env.test' },
    dev: { envFile: '.env.dev' },
    staging: { envFile: '.env.staging' },
    prod: { envFile: '.env.prod' },
  };
}

/**
 * Defines a type-safe Stripe Sync configuration object
 * @param config - The configuration object
 * @returns The validated configuration
 */
export function defineConfig(config: StripeSyncConfig): StripeSyncConfig {
  // Validate the configuration at runtime
  const validatedConfig = stripeSyncConfigSchema.parse(config);
  return validatedConfig;
}
