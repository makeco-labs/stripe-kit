import type { Config as DrizzleConfig } from 'drizzle-kit';
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
import type { HealthCheckResult } from '@/dialects/result.types';

// ========================================================================
// COORDINATOR FUNCTION
// ========================================================================

/**
 * Checks database connection and health based on the dialect
 */
export async function checkHealth(
  config: DrizzleConfig
): Promise<HealthCheckResult> {
  try {
    if (isPostgresConfig(config)) {
      const credentials = extractPostgresCredentials(config);
      const { preparePostgresDB, checkPostgresConnection } = await import(
        '@/dialects/postgres'
      );
      const connection = await preparePostgresDB(credentials);
      return await checkPostgresConnection(connection);
    }

    if (isSqliteConfig(config)) {
      if (isTursoConfig(config)) {
        const credentials = extractTursoCredentials(config);
        const { prepareTursoDB, checkTursoConnection } = await import(
          '@/dialects/turso'
        );
        const connection = await prepareTursoDB(credentials);
        return await checkTursoConnection(connection);
      }
      const credentials = extractSqliteCredentials(config);
      const { prepareSQLiteDB, checkSqliteConnection } = await import(
        '@/dialects/sqlite'
      );
      const connection = await prepareSQLiteDB(credentials);
      return await checkSqliteConnection(connection);
    }

    if (isMysqlConfig(config)) {
      const credentials = extractMysqlCredentials(config);
      const { prepareMysqlDB, checkMysqlConnection } = await import(
        '@/dialects/mysql'
      );
      const connection = await prepareMysqlDB(credentials);
      return await checkMysqlConnection(connection);
    }

    if (isSingleStoreConfig(config)) {
      const credentials = extractSingleStoreCredentials(config);
      const { prepareSingleStoreDB, checkSingleStoreConnection } = await import(
        '@/dialects/singlestore'
      );
      const connection = await prepareSingleStoreDB(credentials);
      return await checkSingleStoreConnection(connection);
    }

    if (isGelConfig(config)) {
      const credentials = extractGelCredentials(config);
      const { prepareGelDB, checkGelConnection } = await import(
        '@/dialects/gel'
      );
      const connection = await prepareGelDB(credentials);
      return await checkGelConnection(connection);
    }

    throw new Error(`Unsupported configuration: ${JSON.stringify(config)}`);
  } catch (error) {
    console.error('Database connection check failed:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

// ========================================================================
// CLI EXECUTION FUNCTION
// ========================================================================

/**
 * Executes database health check
 */
export async function executeHealth(config: DrizzleConfig): Promise<void> {
  console.log('\n🏥 Checking database health...');

  try {
    const result = await checkHealth(config);

    if (result.status === 'ok') {
      if (result.version) {
        console.log(`✅ Connection successful. (${result.version})`);
      } else {
        console.log('✅ Connection successful.');
      }
    } else {
      throw new Error(result.message || 'Database health check failed');
    }
  } catch (error) {
    console.error(
      '❌ Database health check failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    process.exit(1);
  }
}
