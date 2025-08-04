import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';

import type { Config } from './schemas';
import { configSchema } from './schemas';

// ========================================================================
// CONFIG DISCOVERY FUNCTIONS
// ========================================================================

/**
 * Discovers stripe config file in the current working directory
 */
export function discoverStripeConfig(): string | null {
  const configPatterns = [
    'stripe.config.ts',
    'stripe.config.js',
    'stripe.config.mjs',
  ];
  const cwd = process.cwd();

  for (const pattern of configPatterns) {
    const configPath = path.join(cwd, pattern);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }
  return null;
}

/**
 * Loads and parses a stripe config file
 */
export async function loadConfig(input: {
  configPath?: string;
}): Promise<Config> {
  const { configPath } = input;
  let resolvedConfigPath: string;

  if (configPath) {
    // User provided a specific config path
    resolvedConfigPath = path.resolve(configPath);
  } else {
    // Auto-discovery: look for stripe.config files
    const discoveredConfig = discoverStripeConfig();
    if (!discoveredConfig) {
      console.error('❌ Error: No stripe.config.ts file found.');
      console.error(
        'Expected files: stripe.config.ts, stripe.config.js, or stripe.config.mjs'
      );
      console.error('Or specify a config file with --config flag');
      console.error('');
      console.error('Example stripe.config.ts:');
      console.error(`import { defineConfig } from 'stripe-sync';`);
      console.error('export default defineConfig({');
      console.error('  plans: [...],');
      console.error('  adapters: {...},');
      console.error('  envFiles: {...}');
      console.error('});');
      process.exit(1);
    }
    resolvedConfigPath = discoveredConfig;
  }

  // Check if file exists
  if (!fs.existsSync(resolvedConfigPath)) {
    throw new Error(`Stripe config file not found at: ${resolvedConfigPath}`);
  }

  try {
    // Convert to file URL for dynamic import
    const configUrl = pathToFileURL(resolvedConfigPath).href;
    const configModule = await import(configUrl);

    const config = configModule.default || configModule;

    // Validate the configuration
    const validatedConfig = configSchema.parse(config);

    return validatedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // In Zod v4, use the issues property instead of errors
      const errorMessages = error.issues.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      throw new Error(
        `Invalid stripe config file:\n${errorMessages.join('\n')}`
      );
    }
    throw new Error(`Failed to load stripe config file: ${error}`);
  }
}
