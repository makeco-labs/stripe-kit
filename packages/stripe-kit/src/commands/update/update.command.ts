import { Command } from 'commander';
import chalk from 'chalk';

import { updateStripeSubscriptionPlansAction } from './update.action';
import { runUpdatePreflight, type UpdateOptions } from './update.preflight';

export const update = new Command()
  .name('update')
  .description('Update Stripe subscription plans')
  .option('-e, --env <environment>', 'Target environment (test, dev, staging, prod)')
  .option('-a, --adapter <name>', 'Database adapter name')
  .action(async (options: UpdateOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx } = await runUpdatePreflight(options, command);

      // Execute the action
      await updateStripeSubscriptionPlansAction(ctx);

      console.log(chalk.green.bold('\\n✅ UPDATE action completed successfully!'));
    } catch (error) {
      console.error(chalk.red(`\\n❌ Operation failed: ${error}`));
      process.exit(1);
    }
  });