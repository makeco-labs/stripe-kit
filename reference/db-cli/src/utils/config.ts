import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import type { Config as DrizzleConfig } from 'drizzle-kit';
import type { DbConfig } from '@/types';

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
// CONFIG DISCOVERY FUNCTIONS (moved from db-cli.ts)
// ========================================================================

/**
 * Discovers db config file in the current working directory
 */
export function discoverDbConfig(): string | null {
  const configPatterns = [
    'db.config.ts',
    'db.config.js',
    'db.config.mjs',
    'db.config.cjs',
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
 * Loads and parses a drizzle config file
 */
export async function loadDrizzleConfig(
  drizzleConfigPath: string
): Promise<DrizzleConfig> {
  try {
    const absolutePath = path.resolve(drizzleConfigPath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Drizzle config file not found: ${drizzleConfigPath}`);
    }

    const { unregister } = await safeRegister();
    const require = createRequire(import.meta.url);
    const required = require(absolutePath);
    const drizzleConfig = required.default ?? required;
    unregister();

    // Validate that we have a valid drizzle config
    if (!drizzleConfig || typeof drizzleConfig !== 'object') {
      throw new Error(`Invalid drizzle config file: ${drizzleConfigPath}`);
    }
    if (!drizzleConfig.dialect) {
      throw new Error(
        `Drizzle config file missing required 'dialect' field: ${drizzleConfigPath}`
      );
    }
    return drizzleConfig;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to load drizzle config file: ${drizzleConfigPath}`);
  }
}

/**
 * Loads and parses a db config file
 */
export async function loadDbConfig(dbConfigPath: string): Promise<DbConfig> {
  try {
    const absolutePath = path.resolve(dbConfigPath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`DB config file not found: ${dbConfigPath}`);
    }

    const { unregister } = await safeRegister();
    const require = createRequire(import.meta.url);
    const required = require(absolutePath);
    const dbConfig = required.default ?? required;
    unregister();

    // Validate that we have a valid db config
    if (!dbConfig || typeof dbConfig !== 'object') {
      throw new Error(`Invalid DB config file: ${dbConfigPath}`);
    }
    if (!dbConfig.drizzleConfig) {
      throw new Error(
        `DB config file missing required 'drizzleConfig' field: ${dbConfigPath}`
      );
    }
    return dbConfig;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to load DB config file: ${dbConfigPath}`);
  }
}

/**
 * Resolves db.config.ts and its referenced drizzle config
 * Always requires a db.config.ts file with a drizzleConfig property
 */
export async function resolveConfigs(dbConfigPath?: string): Promise<{
  drizzleConfig: DrizzleConfig;
  dbConfig: DbConfig;
  drizzleConfigPath: string;
}> {
  // Determine db config path
  let resolvedDbConfigPath: string;

  if (dbConfigPath) {
    // User provided a specific db config path
    resolvedDbConfigPath = dbConfigPath;
  } else {
    // Auto-discovery: look for db.config files
    const discoveredDbConfig = discoverDbConfig();
    if (!discoveredDbConfig) {
      console.error('❌ Error: No db.config.ts file found.');
      console.error(
        'Expected files: db.config.ts, db.config.js, db.config.mjs, or db.config.cjs'
      );
      console.error('Or specify a config file with --config flag');
      console.error('');
      console.error('Example db.config.ts:');
      console.error(`import { defineConfig } from '@/';`);
      console.error('export default defineConfig({');
      console.error(`  drizzleConfig: './drizzle.config.ts',`);
      console.error(
        `  seed: './src/db/seed.ts'  // Optional: only needed for seed command`
      );
      console.error('});');
      process.exit(1);
    }
    resolvedDbConfigPath = discoveredDbConfig;
  }

  // Load the db config
  const dbConfig = await loadDbConfig(resolvedDbConfigPath);

  // Resolve the drizzle config path from db config
  const drizzleConfigPath = path.resolve(dbConfig.drizzleConfig);

  // Load the drizzle config
  const drizzleConfig = await loadDrizzleConfig(drizzleConfigPath);

  return {
    drizzleConfig,
    dbConfig,
    drizzleConfigPath,
  };
}
