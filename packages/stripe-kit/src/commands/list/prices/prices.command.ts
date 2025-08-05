import chalk from 'chalk';
import { Command } from 'commander';

import { listStripePricesAction } from './prices.action';
import {
  type ListPricesOptions,
  runListPricesPreflight,
} from './prices.preflight';

export const prices = new Command()
  .name('prices')
  .description('List Stripe prices')
  .option(
    '-e, --env <environment>',
    'Target environment (test, dev, staging, prod)'
  )
  .option('--all', 'Show all items in Stripe account')
  .action(async (options: ListPricesOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, showAll } = await runListPricesPreflight(options, command);

      // Execute the action
      await listStripePricesAction(ctx, { showAll });

      console.log(chalk.green('\nOperation completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
