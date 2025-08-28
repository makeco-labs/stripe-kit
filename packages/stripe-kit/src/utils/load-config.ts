import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { z } from 'zod';

import type { Config } from '@/definitions';
import { configSchema } from '@/definitions';

// ========================================================================
// TYPESCRIPT COMPILATION UTILITIES
// ========================================================================

const safeRegister = async () => {
  const { register } = await import('esbuild-register/dist/node');
  let res: { unregister: () => void };
  try {
    res = register({
      format: 'cjs',
      loader: 'ts',
    });
  } catch {
    // tsx fallback
    res = {
      unregister: () => {
        // No-op for tsx fallback
      },
    };
  }
  return res;
};

// ========================================================================
// CONFIG LOADING UTILITIES
// ========================================================================

/**
 * Loads a config file using the appropriate method based on file extension
 */
async function loadConfigFile(absolutePath: string): Promise<unknown> {
  const { unregister } = await safeRegister();

  let config: unknown;
  const ext = path.extname(absolutePath);

  if (ext === '.cjs') {
    // Use createRequire only for .cjs files
    const require = createRequire(import.meta.url);
    const required = require(absolutePath);
    config = required.default ?? required;
  } else {
    // Use dynamic import for .ts, .js, .mjs (handles ESM properly)
    const { pathToFileURL } = await import('node:url');
    const fileUrl = pathToFileURL(absolutePath).href;
    const imported = await import(fileUrl);
    config = imported.default ?? imported;
  }

  unregister();
  return config;
}

/**
 * Handles errors during config loading with enhanced messaging
 */
function handleConfigLoadError(error: unknown): never {
  if (error instanceof z.ZodError) {
    // In Zod v4, use the issues property instead of errors
    const errorMessages = error.issues.map(
      (err) => `${err.path.join('.')}: ${err.message}`
    );
    throw new Error(`Invalid stripe config file:\n${errorMessages.join('\n')}`);
  }

  // Enhanced error handling for module resolution issues
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (
    errorMessage.includes('ERR_PACKAGE_PATH_NOT_EXPORTED') ||
    errorMessage.includes('Cannot resolve module')
  ) {
    throw new Error(
      'Failed to load stripe config file: ' +
        errorMessage +
        '\n\n' +
        'This error often occurs when:\n' +
        '- Your config file imports ESM-only packages\n' +
        '- Workspace packages have complex export maps\n' +
        '- There are module resolution conflicts\n\n' +
        'Try checking your package.json exports and dependencies.'
    );
  }

  throw new Error(`Failed to load stripe config file: ${error}`);
}

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
    'stripe.config.cjs',
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
        'Expected files: stripe.config.ts, stripe.config.js, stripe.config.mjs, or stripe.config.cjs'
      );
      console.error('Or specify a config file with --config flag');
      console.error('');
      console.error('Example stripe.config.ts:');
      console.error(`import { defineConfig } from 'stripe-kit';`);
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
    const absolutePath = path.resolve(resolvedConfigPath);
    const config = await loadConfigFile(absolutePath);

    // Validate the configuration
    const validatedConfig = configSchema.parse(config);

    return validatedConfig;
  } catch (error) {
    return handleConfigLoadError(error);
  }
}
