#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { Command, Option } from 'commander';
import { createDefaultMappers } from '../actions';
import { loadStripeSyncConfig } from '../config';
import {
  archiveStripeSubscriptionPlans,
  ensureStripeSubscriptionPlans,
  fetchStripePrices,
  fetchStripeProducts,
} from '../actions';
import type { StripeSyncConfig } from '../config';
import type { Context, WithClient } from '../types';
import { createLogger, createStripeClient } from '../utils';
import type {
  ActionKey,
  CliOptions,
  DialectKey,
  EnvironmentKey,
} from './definitions';
import {
  ACTION_REQUIREMENTS,
  ACTIONS,
  VALID_DIALECTS,
  VALID_ENVIRONMENTS,
} from './definitions';
import { loadEnvironment } from './environment';
import {
  confirmProductionOperation,
  determineAction,
  determineDialect,
  determineEnvironment,
} from './prompts';
import { setupSignalHandlers } from './signals';

// ========================================================================
// SETUP
// ========================================================================

// Setup signal handlers
setupSignalHandlers();

const projectRoot = process.cwd();

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

/**
 * Sets up environment variables based on the chosen environment
 */
function setupEnvironment(
  chosenEnv: EnvironmentKey,
  config: StripeSyncConfig
): void {
  const envFileName = config.envFiles[chosenEnv];

  if (!envFileName) {
    console.warn(
      chalk.yellow(`No environment file configured for: ${chosenEnv}`)
    );
    return;
  }

  const specificEnvPath = path.join(projectRoot, envFileName);
  const relativeEnvPath = path.relative(projectRoot, specificEnvPath);

  if (fs.existsSync(specificEnvPath)) {
    console.log(
      chalk.blue(`Loading environment from: ${chalk.bold(relativeEnvPath)}`)
    );
    loadEnvironment(chosenEnv);
  } else {
    console.warn(
      chalk.yellow(
        `[DEBUG] Warning: Target environment file NOT FOUND at "${specificEnvPath}".`
      )
    );
  }
}

/**
 * Creates the context object for executing stripe operations
 */
function createContext(
  _dialect: DialectKey,
  config: StripeSyncConfig
): WithClient<Context> {
  const logger = createLogger();

  const stripeSecretKey = config.env.stripeSecretKey;

  const stripeClient = createStripeClient({ STRIPE_SECRET_KEY: stripeSecretKey });

  // Create default mappers for Stripe operations
  const mappers = createDefaultMappers();

  return {
    logger,
    payment: { stripeClient },
    mappers,
    adapter: config.adapter,
    env: process.env,
  };
}

// ========================================================================
// ACTION IMPLEMENTATIONS
// ========================================================================

/**
 * Shows the Stripe dashboard URL
 */
function showStripeDashboardUrl(): void {
  console.log(
    chalk.blue(
      'Stripe Dashboard URL: https://dashboard.stripe.com/test/products?active=true'
    )
  );
}

/**
 * Lists Stripe products
 */
// biome-ignore lint/suspicious/noExplicitAny: Context type from createContext
async function listProducts(ctx: any): Promise<void> {
  try {
    const products = await fetchStripeProducts(ctx);

    if (products.length === 0) {
      ctx.logger.info('No products found in Stripe.');
      return;
    }

    ctx.logger.info(`Found ${products.length} products in Stripe:`);
    for (const product of products) {
      console.log(chalk.green(`ID: ${chalk.bold(product.id)}`));
      console.log(`  Name: ${product.name}`);
      console.log(`  Active: ${product.active}`);
      console.log(`  Description: ${product.description || 'N/A'}`);
      console.log(
        `  Internal ID: ${product.metadata?.internal_product_id || 'N/A'}`
      );
      console.log('');
    }
  } catch (error) {
    ctx.logger.error('Error listing products:', error);
    throw error;
  }
}

/**
 * Lists Stripe prices
 */
// biome-ignore lint/suspicious/noExplicitAny: Context type from createContext
async function listPrices(ctx: any): Promise<void> {
  try {
    const prices = await fetchStripePrices(ctx);

    if (prices.length === 0) {
      ctx.logger.info('No prices found in Stripe.');
      return;
    }

    ctx.logger.info(`Found ${prices.length} prices in Stripe:`);
    for (const price of prices) {
      console.log(chalk.green(`ID: ${chalk.bold(price.id)}`));
      console.log(`  Product: ${price.product}`);
      console.log(`  Active: ${price.active}`);
      console.log(`  Currency: ${price.currency.toUpperCase()}`);
      console.log(`  Type: ${price.type}`);

      if (price.type === 'recurring') {
        console.log(`  Interval: ${price.recurring?.interval}`);
        console.log(`  Interval Count: ${price.recurring?.interval_count}`);
      }

      if (typeof price.unit_amount === 'number') {
        console.log(
          `  Amount: ${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`
        );
      }

      console.log(
        `  Internal ID: ${price.metadata?.internal_price_id || 'N/A'}`
      );
      console.log('');
    }
  } catch (error) {
    ctx.logger.error('Error listing prices:', error);
    throw error;
  }
}

// ========================================================================
// MAIN ACTION HANDLER
// ========================================================================

/**
 * Main action handler that orchestrates the CLI flow
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Main CLI handler needs to handle all actions
async function handleAction(
  actionInput: ActionKey | undefined,
  options: CliOptions
): Promise<void> {
  try {
    // Load stripe configuration
    const config = await loadStripeSyncConfig();

    const chosenAction = await determineAction(actionInput);

    let chosenEnv: EnvironmentKey | undefined;
    let chosenDialect: DialectKey | undefined;

    const requirements = ACTION_REQUIREMENTS[chosenAction];
    if (!requirements) {
      console.error(
        chalk.red(
          `Internal error: No requirements defined for action '${chosenAction}'`
        )
      );
      process.exit(1);
    }

    if (requirements.needsEnv) {
      chosenEnv = await determineEnvironment(options.env);
      setupEnvironment(chosenEnv, config);
    }

    if (requirements.needsDialect) {
      chosenDialect = await determineDialect(options.dialect);
    }

    // url doesn't need context
    switch (chosenAction) {
      case ACTIONS.URL:
        return showStripeDashboardUrl();
      default:
        break;
    }

    const ctx = createContext(chosenDialect || 'postgres', config);

    switch (chosenAction) {
      case ACTIONS.CREATE:
        if (chosenEnv === 'prod') {
          const confirmed = await confirmProductionOperation(
            'create plans',
            chosenEnv
          );
          if (!confirmed) {
            process.exit(0);
          }
        }
        await ensureStripeSubscriptionPlans(ctx, { plans: config.plans });
        break;
      case ACTIONS.ARCHIVE: {
        if (chosenEnv === 'prod') {
          const confirmed = await confirmProductionOperation(
            'archive plans',
            chosenEnv
          );
          if (!confirmed) {
            process.exit(0);
          }
        }
        const productIdsToDelete = config.productIds
          ? Object.values(config.productIds)
          : config.plans.map((plan: { id: string }) => plan.id);
        await archiveStripeSubscriptionPlans(ctx, {
          internalProductIds: productIdsToDelete,
        });
        break;
      }
      case ACTIONS.SYNC:
        // TODO: Implement sync with adapter
        ctx.logger.info('Sync operation not yet implemented');
        break;
      case ACTIONS.UPDATE:
        // TODO: Implement update
        ctx.logger.info('Update operation not yet implemented');
        break;
      case ACTIONS.CLEAR_DB_PLANS:
        // TODO: Implement clear-db-plans with adapter
        ctx.logger.info('Clear DB plans operation not yet implemented');
        break;
      case ACTIONS.LIST_PRODUCTS:
        return await listProducts(ctx);
      case ACTIONS.LIST_PRICES:
        return await listPrices(ctx);
      default:
        console.error(
          chalk.red(`Internal error: Unhandled action '${chosenAction}'`)
        );
        process.exit(1);
    }

    console.log(
      chalk.green.bold(
        `\\n✅ ${chosenAction.toUpperCase()} action completed successfully!`
      )
    );
  } catch (error) {
    console.error(chalk.red(`\\n❌ Operation failed: ${error}`));
    process.exit(1);
  }
}

// ========================================================================
// CLI SETUP
// ========================================================================

// Create the CLI program
const program = new Command()
  .name('stripe-sync')
  .description('CLI helper for managing Stripe subscription plans')
  .version('0.1.0');

program
  .argument(
    '[action]',
    'Action to perform (create, archive, sync, update, clear-db-plans, list-products, list-prices)'
  )
  .addOption(
    new Option('-e, --env <name>', 'Specify the target environment').choices(
      VALID_ENVIRONMENTS
    )
  )
  .addOption(
    new Option('-d, --dialect <name>', 'Specify the database dialect').choices(
      VALID_DIALECTS
    )
  )
  .action(handleAction);

program.addHelpText(
  'after',
  `

Examples:
  stripe-sync create --env test
  stripe-sync archive --env staging
  stripe-sync sync --env dev --dialect postgres
  stripe-sync list-products --env test
  stripe-sync list-prices --env test
  stripe-sync clear-db-plans --dialect sqlite --env test
  stripe-sync create --env prod
  `
);

// ========================================================================
// EXECUTION
// ========================================================================

// Only run CLI when this file is executed directly, not when imported
if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .parseAsync(process.argv)
    .catch((error) => {
      console.error(chalk.red('An unexpected error occurred:'), error);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}
