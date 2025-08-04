import type { Config } from 'drizzle-kit';
import {
  extractGelCredentials,
  extractMysqlCredentials,
  extractPostgresCredentials,
  extractSingleStoreCredentials,
  extractSqliteCredentials,
  extractTursoCredentials,
  isGelConfig,
  isMysqlConfig,
  isPostgresConfig,
  isSingleStoreConfig,
  isSqliteConfig,
  isTursoConfig,
} from '@/dialects';
import type { ResetResult } from '@/dialects/result.types';

// ========================================================================
// COORDINATOR FUNCTION
// ========================================================================

/**
 * Resets the database by dropping all user tables while preserving system tables
 * and migration history tables
 */
export async function resetDatabase(config: Config): Promise<ResetResult> {
  try {
    console.log(`Resetting ${config.dialect} database...`);

    if (isPostgresConfig(config)) {
      const credentials = extractPostgresCredentials(config);
      const { preparePostgresDB, resetPostgresDatabase } = await import(
        '@/dialects/postgres'
      );
      const connection = await preparePostgresDB(credentials);
      return await resetPostgresDatabase(connection);
    }

    if (isSqliteConfig(config)) {
      if (isTursoConfig(config)) {
        const credentials = extractTursoCredentials(config);
        const { prepareTursoDB, resetTursoDatabase } = await import(
          '@/dialects/turso'
        );
        const connection = await prepareTursoDB(credentials);
        return await resetTursoDatabase(connection);
      }
      const credentials = extractSqliteCredentials(config);
      const { prepareSQLiteDB, resetSqliteDatabase } = await import(
        '@/dialects/sqlite'
      );
      const connection = await prepareSQLiteDB(credentials);
      return await resetSqliteDatabase(connection);
    }

    if (isMysqlConfig(config)) {
      const credentials = extractMysqlCredentials(config);
      const { prepareMysqlDB, resetMysqlDatabase } = await import(
        '@/dialects/mysql'
      );
      const connection = await prepareMysqlDB(credentials);
      return await resetMysqlDatabase(connection);
    }

    if (isSingleStoreConfig(config)) {
      const credentials = extractSingleStoreCredentials(config);
      const { prepareSingleStoreDB, resetSingleStoreDatabase } = await import(
        '@/dialects/singlestore'
      );
      const connection = await prepareSingleStoreDB(credentials);
      return await resetSingleStoreDatabase(connection);
    }

    if (isGelConfig(config)) {
      const credentials = extractGelCredentials(config);
      const { prepareGelDB, resetGelDatabase } = await import('@/dialects/gel');
      const connection = await prepareGelDB(credentials);
      return await resetGelDatabase(connection);
    }

    throw new Error(`Unsupported configuration: ${JSON.stringify(config)}`);
  } catch (error) {
    console.error('Database reset failed:', error);
    return {
      success: false,
      tablesDropped: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ========================================================================
// CLI EXECUTION FUNCTION
// ========================================================================

/**
 * Executes database reset (clears data)
 */
export async function executeReset(config: Config): Promise<void> {
  console.log('\n📋 Resetting database data...');

  try {
    const result = await resetDatabase(config);

    if (result.success) {
      console.log('✅ Database reset completed successfully!');
      if (result.tablesDropped.length > 0) {
        console.log(
          `Dropped ${result.tablesDropped.length} tables/schemas:`,
          result.tablesDropped.join(', ')
        );
      }
    } else {
      throw new Error(result.error || 'Database reset failed');
    }
  } catch (error) {
    console.error(
      '❌ Database reset failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    process.exit(1);
  }
}
