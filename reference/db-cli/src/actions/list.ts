import chalk from 'chalk';
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
import type { ListResult, TableInfo } from '@/dialects/result.types';

// ========================================================================
// DISPLAY FORMATTING UTILITIES
// ========================================================================

/**
 * Formats row count for display
 */
function formatRowCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace('.0', '')}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace('.0', '')}K`;
  }
  return count.toString();
}

/**
 * Formats the list output for schema-supporting databases in compact format
 */
function formatSchemaOutputCompact(schemas: {
  [schemaName: string]: TableInfo[];
}): string {
  const schemaNames = Object.keys(schemas);

  if (schemaNames.length === 0) {
    return 'No tables found.';
  }

  let output = '';
  let totalTables = 0;
  let totalRows = 0;

  schemaNames.forEach((schemaName) => {
    const tables = schemas[schemaName];
    totalTables += tables.length;

    tables.forEach((tableInfo) => {
      const rowCountDisplay =
        tableInfo.rowCount !== undefined
          ? ` ${formatRowCount(tableInfo.rowCount)} rows`
          : '';
      output += `${schemaName}.${tableInfo.name}${rowCountDisplay ? ''.padEnd(Math.max(0, 20 - `${schemaName}.${tableInfo.name}`.length)) + rowCountDisplay : ''}\n`;
      totalRows += tableInfo.rowCount || 0;
    });
  });

  // Add summary
  const summaryParts = [
    `${schemaNames.length} schema${schemaNames.length !== 1 ? 's' : ''}`,
    `${totalTables} table${totalTables !== 1 ? 's' : ''}`,
  ];
  if (totalRows > 0) {
    summaryParts.push(`${formatRowCount(totalRows)} rows`);
  }
  output += `Total: ${summaryParts.join(', ')}`;

  return output.trim();
}

/**
 * Formats the list output for schemaless databases in compact format
 */
function formatFlatOutputCompact(tables: TableInfo[]): string {
  if (tables.length === 0) {
    return 'No tables found.';
  }

  let output = '';
  let totalRows = 0;

  tables.forEach((tableInfo) => {
    const rowCountDisplay =
      tableInfo.rowCount !== undefined
        ? ` ${formatRowCount(tableInfo.rowCount)} rows`
        : '';
    output += `${tableInfo.name}${rowCountDisplay ? ''.padEnd(Math.max(0, 20 - tableInfo.name.length)) + rowCountDisplay : ''}\n`;
    totalRows += tableInfo.rowCount || 0;
  });

  // Add summary
  const summaryParts = [
    `${tables.length} table${tables.length !== 1 ? 's' : ''}`,
  ];
  if (totalRows > 0) {
    summaryParts.push(`${formatRowCount(totalRows)} rows`);
  }
  output += `Total: ${summaryParts.join(', ')}`;

  return output.trim();
}

/**
 * Formats the list output for schema-supporting databases
 */
function formatSchemaOutput(schemas: {
  [schemaName: string]: TableInfo[];
}): string {
  const schemaNames = Object.keys(schemas);

  if (schemaNames.length === 0) {
    return 'No tables found.';
  }

  let output = '';
  let totalTables = 0;

  schemaNames.forEach((schemaName, schemaIndex) => {
    const tables = schemas[schemaName];
    const isLastSchema = schemaIndex === schemaNames.length - 1;
    totalTables += tables.length;

    output += `${chalk.bold(schemaName)}\n`;

    tables.forEach((tableInfo, tableIndex) => {
      const isLastTable = tableIndex === tables.length - 1;
      const prefix = isLastTable ? '└── ' : '├── ';
      const rowCountDisplay =
        tableInfo.rowCount !== undefined
          ? ` (${formatRowCount(tableInfo.rowCount)} rows)`
          : '';
      output += `${prefix}${tableInfo.name}${rowCountDisplay}\n`;
    });

    // Add empty line between schemas (except for the last one)
    if (!isLastSchema) {
      output += '\n';
    }
  });

  // Add summary statistics
  output += '\n📊 Counts:\n';
  output += `- Schemas: ${schemaNames.length}\n`;
  output += `- Tables: ${totalTables}`;

  // Add total row count if available
  const totalRows = schemaNames.reduce((total, schemaName) => {
    return (
      total +
      schemas[schemaName].reduce((schemaTotal, table) => {
        return schemaTotal + (table.rowCount || 0);
      }, 0)
    );
  }, 0);

  if (totalRows > 0) {
    output += `\n- Total Rows: ${formatRowCount(totalRows)}`;
  }

  return output.trim();
}

/**
 * Formats the list output for schemaless databases
 */
function formatFlatOutput(tables: TableInfo[]): string {
  if (tables.length === 0) {
    return 'No tables found.';
  }

  let output = tables
    .map((tableInfo, index) => {
      const rowCountDisplay =
        tableInfo.rowCount !== undefined
          ? ` (${formatRowCount(tableInfo.rowCount)} rows)`
          : '';
      return `${index + 1}. ${tableInfo.name}${rowCountDisplay}`;
    })
    .join('\n');

  // Add summary statistics (no schemas for flat databases)
  output += '\n\n📊 Counts:\n';
  output += `- Tables: ${tables.length}`;

  // Add total row count if available
  const totalRows = tables.reduce(
    (total, table) => total + (table.rowCount || 0),
    0
  );
  if (totalRows > 0) {
    output += `\n- Total Rows: ${formatRowCount(totalRows)}`;
  }

  return output;
}

// ========================================================================
// MAIN LIST ACTION
// ========================================================================

/**
 * Execute list action to show database tables and schemas
 */
export async function executeList(
  drizzleConfig: DrizzleConfig,
  includeRowCounts = false,
  useCompactFormat = false
): Promise<void> {
  try {
    console.log(chalk.blue('📋 Database Tables:\n'));

    let result: ListResult;

    if (isPostgresConfig(drizzleConfig)) {
      const credentials = extractPostgresCredentials(drizzleConfig);
      const { preparePostgresDB, listPostgresTables } = await import(
        '@/dialects/postgres'
      );
      const connection = await preparePostgresDB(credentials);
      result = await listPostgresTables(connection, includeRowCounts);
    } else if (isSqliteConfig(drizzleConfig)) {
      if (isTursoConfig(drizzleConfig)) {
        const credentials = extractTursoCredentials(drizzleConfig);
        const { prepareTursoDB, listTursoTables } = await import(
          '@/dialects/turso'
        );
        const connection = await prepareTursoDB(credentials);
        result = await listTursoTables(connection, includeRowCounts);
      } else {
        const credentials = extractSqliteCredentials(drizzleConfig);
        const { prepareSQLiteDB, listSQLiteTables } = await import(
          '@/dialects/sqlite'
        );
        const connection = await prepareSQLiteDB(credentials);
        result = await listSQLiteTables(connection, includeRowCounts);
      }
    } else if (isMysqlConfig(drizzleConfig)) {
      const credentials = extractMysqlCredentials(drizzleConfig);
      const { prepareMysqlDB, listMysqlTables } = await import(
        '@/dialects/mysql'
      );
      const connection = await prepareMysqlDB(credentials);
      result = await listMysqlTables(connection, includeRowCounts);
    } else if (isSingleStoreConfig(drizzleConfig)) {
      const credentials = extractSingleStoreCredentials(drizzleConfig);
      const { prepareSingleStoreDB, listSingleStoreTables } = await import(
        '@/dialects/singlestore'
      );
      const connection = await prepareSingleStoreDB(credentials);
      result = await listSingleStoreTables(connection, includeRowCounts);
    } else if (isGelConfig(drizzleConfig)) {
      const credentials = extractGelCredentials(drizzleConfig);
      const { prepareGelDB, listGelTables } = await import('@/dialects/gel');
      const connection = await prepareGelDB(credentials);
      result = await listGelTables(connection, includeRowCounts);
    } else {
      throw new Error(`Unsupported database dialect: ${drizzleConfig.dialect}`);
    }

    if (!result.success) {
      console.error(chalk.red(`❌ Failed to list tables: ${result.error}`));
      process.exit(1);
    }

    // Display results based on type
    if (result.schemas) {
      // Schema-supporting database
      if (useCompactFormat) {
        console.log(formatSchemaOutputCompact(result.schemas));
      } else {
        console.log(formatSchemaOutput(result.schemas));
      }
    } else if (result.tables) {
      // Schemaless database
      if (useCompactFormat) {
        console.log(formatFlatOutputCompact(result.tables));
      } else {
        console.log(formatFlatOutput(result.tables));
      }
    } else {
      console.log('No tables found.');
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(chalk.red(`❌ List operation failed: ${message}`));
    process.exit(1);
  }
}
