import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { listStripeProductsAction } from './products.action';
import {
  type ListProductsOptions,
  runListProductsPreflight,
} from './products.preflight';

export const products = new Command()
  .name('products')
  .description('List Stripe products')
  .addOption(
    new Option('-e, --env <environment>', 'Target environment').choices(
      ENV_CHOICES
    )
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
