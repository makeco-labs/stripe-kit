import { Command } from 'commander';
import chalk from 'chalk';

import { clearDbPlansAction } from './clear-db-plans.action';
import { runClearDbPlansPreflight, type ClearDbPlansOptions } from './clear-db-plans.preflight';

export const clearDbPlans = new Command()
  .name('clear-db-plans')
  .description('Delete subscription plans from database')
  .option('-e, --env <environment>', 'Target environment (test, dev, staging, prod)')
  .option('-a, --adapter <name>', 'Database adapter name')
  .action(async (options: ClearDbPlansOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx } = await runClearDbPlansPreflight(options, command);

      // Execute the action
      await clearDbPlansAction(ctx);

      console.log(chalk.green.bold('\\n✅ CLEAR-DB-PLANS action completed successfully!'));
    } catch (error) {
      console.error(chalk.red(`\\n❌ Operation failed: ${error}`));
      process.exit(1);
    }
  });