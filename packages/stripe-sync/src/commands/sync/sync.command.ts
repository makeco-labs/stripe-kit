import { Command } from 'commander';
import chalk from 'chalk';

import { syncStripeSubscriptionPlansAction } from './sync.action';
import { runSyncPreflight, type SyncOptions } from './sync.preflight';

export const sync = new Command()
  .name('sync')
  .description('Sync Stripe subscription plans to database')
  .option('-e, --env <environment>', 'Target environment (test, dev, staging, prod)')
  .option('-a, --adapter <name>', 'Database adapter name')
  .action(async (options: SyncOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx } = await runSyncPreflight(options, command);

      // Execute the action
      await syncStripeSubscriptionPlansAction(ctx);

      console.log(chalk.green.bold('\\n✅ SYNC action completed successfully!'));
    } catch (error) {
      console.error(chalk.red(`\\n❌ Operation failed: ${error}`));
      process.exit(1);
    }
  });