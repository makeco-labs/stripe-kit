import type { SeedResult } from '@/dialects/result.types';

/**
 * Seeds Turso database by running the seed file
 */
export async function seedTursoDatabase(seedPath: string): Promise<SeedResult> {
  const timestamp = new Date().toISOString();

  try {
    console.log(`Loading Turso seed file: ${seedPath}`);

    // Dynamic import of the seed file
    const seedModule = await import(seedPath);

    // Look for common export patterns
    if (typeof seedModule.default === 'function') {
      await seedModule.default();
    } else if (typeof seedModule.seed === 'function') {
      await seedModule.seed();
    } else if (typeof seedModule.main === 'function') {
      await seedModule.main();
    } else {
      throw new Error(
        'Seed file must export a default function, seed function, or main function'
      );
    }

    console.log('Turso database seeded successfully');
    return {
      success: true,
      message: `Turso database seeded from ${seedPath}`,
      timestamp,
    };
  } catch (error) {
    console.error('Error seeding Turso database:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error during Turso seed',
      timestamp,
    };
  }
}
