#!/usr/bin/env node

import chalk from 'chalk';
import { Command, Option } from 'commander';
import type { Config as DrizzleConfig } from 'drizzle-kit';
import type { DbConfig } from '@/types';
import {
  executeCommand,
  executeHealth,
  executeList,
  executeSeed,
  executeTruncate,
  executeWorkflow,
  requireProductionConfirmation,
  validateDrizzleKit,
  WORKFLOWS,
} from '../actions';
import { resolveConfigs } from '../utils/config';
import type { ActionKey, CliOptions } from './definitions';
// Import modules
import { ACTIONS, VALID_ENVIRONMENTS } from './definitions';
import { loadEnvironment } from './environment';
import { determineAction, determineEnvironment } from './prompts';
import { setupSignalHandlers } from './signals';

// ========================================================================
// FUNCTION PARAMETER TYPES
// ========================================================================

interface ExecuteActionInput {
  action: ActionKey;
  drizzleConfigPath: string;
  drizzleConfig: DrizzleConfig;
  envName: string;
  dbConfig: DbConfig;
  includeRowCounts?: boolean;
  compact?: boolean;
}

// Setup signal handlers
setupSignalHandlers(); // Temporarily disabled to test double execution

/**
 * Execute the chosen action
 */
async function executeAction(input: ExecuteActionInput): Promise<void> {
  const {
    action,
    drizzleConfigPath,
    drizzleConfig,
    envName,
    dbConfig,
    includeRowCounts,
    compact,
  } = input;
  switch (action) {
    case ACTIONS.GENERATE:
    case ACTIONS.MIGRATE:
    case ACTIONS.STUDIO:
    case ACTIONS.DROP:
    case ACTIONS.PUSH:
      if (action !== ACTIONS.STUDIO) {
        validateDrizzleKit();
      }
      executeCommand(action, drizzleConfigPath, envName);
      break;

    case ACTIONS.HEALTH:
      await executeHealth(drizzleConfig);
      break;

    case ACTIONS.LIST:
    case ACTIONS.LS:
      await executeList(drizzleConfig, includeRowCounts, compact);
      break;

    case ACTIONS.SEED:
      if (!dbConfig.seed) {
        console.error(
          '❌ Error: Seed command requires a "seed" property in your db.config.ts file'
        );
        console.error('');
        console.error('Example db.config.ts:');
        console.error(`import { defineConfig } from '@/';`);
        console.error('export default defineConfig({');
        console.error(`  drizzleConfig: './drizzle.config.ts',`);
        console.error(`  seed: './src/db/seed.ts'  // Add this line`);
        console.error('});');
        process.exit(1);
      }
      await executeSeed(drizzleConfig, dbConfig.seed);
      break;

    case ACTIONS.TRUNCATE:
      await executeTruncate(drizzleConfig);
      break;

    case ACTIONS.RESET:
      validateDrizzleKit();
      await requireProductionConfirmation('reset', drizzleConfig);
      await executeWorkflow(
        WORKFLOWS.reset,
        drizzleConfigPath,
        drizzleConfig,
        envName
      );
      break;

    case ACTIONS.REFRESH:
      validateDrizzleKit();
      await requireProductionConfirmation('refresh', drizzleConfig);
      await executeWorkflow(
        WORKFLOWS.refresh,
        drizzleConfigPath,
        drizzleConfig,
        envName
      );
      break;

    default:
      console.error(chalk.red(`Unknown action: ${action}`));
      process.exit(1);
  }
}

// Create the CLI program
const program = new Command();

program
  .name('db-cli')
  .description(
    'A higher-level abstraction over drizzle-kit with additional database management commands'
  )
  .version('0.1.0')
  .argument('[action]', 'Action to perform (generate, migrate, studio, etc.)')
  .option('-c, --config <path>', 'Path to db.config.ts file')
  .addOption(
    new Option('-e, --env <name>', 'Environment to load (.env.{name})').choices(
      VALID_ENVIRONMENTS
    )
  )
  .option('--count', 'Include row counts for each table (list/ls command only)')
  .option('-l', 'Long format - include row counts (alias for --count)')
  .option('--compact', 'Use compact output format')
  .action(async (actionInput: string | undefined, options: CliOptions) => {
    const { config: dbConfigPath, env, count, l, compact } = options;

    // Check if this is a list-type action
    const isListAction = actionInput === 'list' || actionInput === 'ls';

    // Validate that list-specific flags are only used with list/ls actions
    if ((count || l) && !isListAction) {
      console.error(
        chalk.red(
          '❌ The --count/-l flags can only be used with the "list" or "ls" actions'
        )
      );
      process.exit(1);
    }

    if (compact && !isListAction) {
      console.error(
        chalk.red(
          '❌ The --compact flag can only be used with the "list" or "ls" actions'
        )
      );
      process.exit(1);
    }

    // Combine count flags: -l is alias for --count
    const includeRowCounts = count || l;

    try {
      // Determine environment and action using original pattern
      const chosenEnv = await determineEnvironment(env);
      const chosenAction = await determineAction(actionInput);

      // Load environment variables BEFORE resolving configs
      loadEnvironment(chosenEnv);

      // Resolve configs using centralized system (always requires db.config.ts)
      const { drizzleConfig, dbConfig, drizzleConfigPath } =
        await resolveConfigs(dbConfigPath);
      console.log(
        chalk.cyan(
          `Using drizzle config: ${drizzleConfigPath} (dialect: ${drizzleConfig.dialect})`
        )
      );

      // Execute the chosen action
      await executeAction({
        action: chosenAction,
        drizzleConfigPath,
        drizzleConfig,
        envName: chosenEnv,
        dbConfig,
        includeRowCounts,
        compact,
      });

      // Exit successfully after command completion
      process.exit(0);
    } catch {
      console.error(
        chalk.red(`\n❌ Operation failed during action: ${actionInput}`)
      );
      process.exit(1);
    }
  });

// Add help examples
program.addHelpText(
  'after',
  `

Commands:
  drop     - Drop migrations folder (drizzle-kit default behavior)
  generate - Generate new migrations from schema changes
  migrate  - Apply pending migrations to the database
  studio   - Launch Drizzle Studio web interface
  push     - Push schema changes directly to database (no migrations)
  health   - Check database connection and health status
  list     - List database tables and schemas
  ls       - List database tables and schemas (alias for list)
  seed     - Seed database with initial data (requires seed path in db.config.ts)
  truncate - Truncate database data while preserving table structure
  reset    - Clear database data (drop all tables and schemas)
  refresh  - Complete refresh: drop migrations → generate → clear data → migrate

Flags for list/ls commands:
  --count  - Include row counts for each table
  -l       - Long format (alias for --count)
  --compact - Use compact output format without emojis

`
);

// ------------------ EXECUTE COMMANDER ------------------
// Only run CLI when this file is executed directly, not when imported
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parseAsync(process.argv).catch((error) => {
    console.error(
      chalk.red(
        'An unexpected error occurred outside the main action handler:'
      ),
      error
    );
    process.exit(1);
  });
}
