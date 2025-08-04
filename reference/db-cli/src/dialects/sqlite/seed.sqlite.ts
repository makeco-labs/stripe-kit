import fs from 'node:fs';
import path from 'node:path';
import type { SeedResult } from '@/dialects/result.types';

/**
 * Seeds a SQLite database by executing a seed file
 */
export async function seedSQLiteDatabase(
  seedPath: string
): Promise<SeedResult> {
  const timestamp = new Date().toISOString();

  try {
    // Validate seed file exists
    const absoluteSeedPath = path.resolve(seedPath);
    if (!fs.existsSync(absoluteSeedPath)) {
      return {
        success: false,
        error: `Seed file not found: ${seedPath}`,
        timestamp,
      };
    }

    // Execute the seed file
    // The seed file should export a default function that handles its own connection
    const seedModule = await import(absoluteSeedPath);
    const seedFunction = seedModule.default || seedModule.seed;

    if (typeof seedFunction !== 'function') {
      return {
        success: false,
        error: `Seed file must export a default function or named 'seed' function: ${seedPath}`,
        timestamp,
      };
    }

    // Execute the seed function (zero abstraction - no parameters)
    await seedFunction();

    return {
      success: true,
      message: `Database seeded successfully from ${seedPath}`,
      timestamp,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error during SQLite seed',
      timestamp,
    };
  }
}
