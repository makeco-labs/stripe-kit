import chalk from 'chalk';
import { Command } from 'commander';

import { listStripeProductsAction } from './products.action';
import {
  type ListProductsOptions,
  runListProductsPreflight,
} from './products.preflight';

export const products = new Command()
  .name('products')
  .description('List Stripe products')
  .option(
    '-e, --env <environment>',
    'Target environment (test, dev, staging, prod)'
  )
  .option('--all', 'Show all items in Stripe account')
  .action(async (options: ListProductsOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, showAll } = await runListProductsPreflight(options, command);

      // Execute the action
      await listStripeProductsAction(ctx, { showAll });

      console.log(chalk.green('\nOperation completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
