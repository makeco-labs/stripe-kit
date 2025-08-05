import chalk from 'chalk';
import { Command } from 'commander';

import { showStripeUrlsAction } from './urls.action';

export interface UrlsOptions {
  all?: boolean;
}

export const urls = new Command()
  .name('urls')
  .description('Show Stripe dashboard URLs')
  .option('-a, --all', 'Show all URLs with labels')
  .action(async (options: UrlsOptions) => {
    try {
      // Execute the action directly - no preflight needed
      await showStripeUrlsAction({
        showAll: !!options.all,
      });
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
