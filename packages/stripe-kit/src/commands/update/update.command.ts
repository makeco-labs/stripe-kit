import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { updateStripeSubscriptionPlansAction } from './update.action';
import { runUpdatePreflight, type UpdateOptions } from './update.preflight';

export const update = new Command()
  .name('update')
  .description('Update Stripe subscription plans')
  .addOption(
    new Option('-e, --env <environment>', 'Target environment').choices(
      ENV_CHOICES
    )
  )
  .option('-a, --adapter <name>', 'Database adapter name')
  .action(async (options: UpdateOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx } = await runUpdatePreflight(options, command);

      // Execute the action
      await updateStripeSubscriptionPlansAction(ctx);

      console.log(chalk.green('\nOperation completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
