import { Command } from 'commander';
import chalk from 'chalk';

import { showStripeDashboardUrlAction } from './url.action';
import { runUrlPreflight, type UrlOptions } from './url.preflight';

export const url = new Command()
  .name('url')
  .description('Show Stripe dashboard URL')
  .option('-e, --env <environment>', 'Target environment (test, dev, staging, prod)')
  .option('-a, --adapter <name>', 'Database adapter name')
  .action(async (options: UrlOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx } = await runUrlPreflight(options, command);

      // Execute the action
      await showStripeDashboardUrlAction(ctx);

      console.log(chalk.green.bold('\\n✅ URL action completed successfully!'));
    } catch (error) {
      console.error(chalk.red(`\\n❌ Operation failed: ${error}`));
      process.exit(1);
    }
  });