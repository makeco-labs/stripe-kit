import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BILLING_PRODUCT_IDS, subscriptionPlans } from '@billing/domain';
import { createStripeClient } from '@billing/infra/external/stripe';
// Import all the setup functions from the individual scripts
import {
  archiveStripeSubscriptionPlans,
  ensureStripeSubscriptionPlans,
  fetchStripePrices,
  fetchStripeProducts,
  syncStripeSubscriptionPlans,
  updateStripeSubscriptionPlans,
} from '@billing/infra/tasks';
import { getDbConnection } from '@infra/db/connection';
import { billingPrices, billingProducts } from '@infra/db/tables';
import { createPinoLogger } from '@infra/logger';
import { serverEnvSchema } from '@lib/config/env/schemas';
import type { Context, CoreContext, WithClient } from '@platform/context';
import chalk from 'chalk';
import { Command, Option } from 'commander';
import dotenv from 'dotenv';
import prompts from 'prompts';

// ------------------ CONFIGURATION ------------------
const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(
  __filename,
  '..',
  '..',
  '..',
  '..',
  '..',
  '..'
);

const validActions = [
  'create', // Create Stripe subscription plans
  'archive', // Archive Stripe subscription plans
  'sync', // Sync Stripe subscription plans to DB
  'update', // Update Stripe subscription plans
  'clear-db-plans', // Delete subscription plans from DB
  'url', // Show Stripe dashboard URL
  'list-products', // List Stripe products
  'list-prices', // List Stripe prices
] as const;

const validEnvironments = ['test', 'dev', 'staging', 'prod'] as const;
const validDialects = ['sqlite', 'postgres', 'turso'] as const;

type ActionKey = (typeof validActions)[number];
type EnvironmentKey = (typeof validEnvironments)[number];
type DialectKey = (typeof validDialects)[number];

const envMap: Record<EnvironmentKey, { file: string; value: string }> = {
  test: { file: '.env.test', value: 'test' },
  dev: { file: '.env.dev', value: 'development' },
  staging: { file: '.env.staging', value: 'staging' },
  prod: { file: '.env.prod', value: 'production' },
};

// --- New: Action Input Requirements Configuration ---
interface ActionInputRequirements {
  needsEnv: boolean;
  needsDialect: boolean;
}

const actionInputRequirements: Record<ActionKey, ActionInputRequirements> = {
  create: { needsEnv: true, needsDialect: false },
  archive: { needsEnv: true, needsDialect: false },
  sync: { needsEnv: true, needsDialect: true },
  update: { needsEnv: true, needsDialect: false },
  'clear-db-plans': { needsEnv: true, needsDialect: true },
  url: { needsEnv: false, needsDialect: false },
  'list-products': { needsEnv: true, needsDialect: false },
  'list-prices': { needsEnv: true, needsDialect: false },
};

const actionDescriptions: Record<ActionKey, string> = {
  create: '[create]: Create Stripe subscription plans (Idempotent)',
  archive: '[archive]: Archive Stripe subscription plans',
  sync: '[sync]: Sync Stripe subscription plans to database',
  update: '[update]: Update Stripe subscription plans',
  'clear-db-plans': '[clear-db-plans]: Delete subscription plans from database',
  url: '[url]: Show Stripe dashboard URL',
  'list-products': '[list-products]: List Stripe products',
  'list-prices': '[list-prices]: List Stripe prices',
};

// ------------------ HELPER FUNCTIONS ------------------

/**
 * Determines the action to be performed, either from input or via interactive prompt
 */
async function determineAction(
  actionInput: ActionKey | undefined
): Promise<ActionKey> {
  let chosenAction: ActionKey;

  if (actionInput && validActions.includes(actionInput as ActionKey)) {
    chosenAction = actionInput as ActionKey;
    console.log(
      chalk.green(`Action specified via argument: ${chalk.bold(chosenAction)}`)
    );
  } else {
    if (actionInput) {
      console.log(
        chalk.yellow(`Invalid action specified: "${actionInput}". Prompting...`)
      );
    }
    try {
      const response = await prompts({
        type: 'select',
        name: 'value',
        message: chalk.blue('Select the action to perform:'),
        choices: validActions.map((act) => ({
          title: actionDescriptions[act],
          value: act,
        })),
        initial: 0, // Default selection highlight
      });
      if (!response.value) {
        console.log(chalk.red('\nOperation canceled.'));
        process.exit(0);
      }
      chosenAction = response.value;
      console.log(
        chalk.green(`Action selected via prompt: ${chalk.bold(chosenAction)}`)
      );
    } catch (error) {
      console.error(chalk.red('Error during action prompt:'), error);
      process.exit(1);
    }
  }

  return chosenAction;
}

/**
 * Determines the environment to be used, either from input or via interactive prompt
 */
async function determineEnvironment(
  envInput: EnvironmentKey | undefined
): Promise<EnvironmentKey> {
  let chosenEnv: EnvironmentKey;

  if (envInput && validEnvironments.includes(envInput)) {
    chosenEnv = envInput;
    console.log(
      chalk.green(`Environment specified via flag: ${chalk.bold(chosenEnv)}`)
    );
  } else {
    try {
      const response = await prompts({
        type: 'select',
        name: 'value',
        message: chalk.blue('Select the target environment:'),
        choices: [
          {
            title: 'Test Environment',
            value: 'test' as EnvironmentKey,
          },
          {
            title: 'Development Server',
            value: 'dev' as EnvironmentKey,
          },
          {
            title: 'Staging Environment',
            value: 'staging' as EnvironmentKey,
          },
          {
            title: 'Production Environment',
            value: 'prod' as EnvironmentKey,
          },
        ],
      });
      if (!response.value) {
        console.log(chalk.red('\nOperation canceled.'));
        process.exit(0);
      }
      chosenEnv = response.value;
      console.log(
        chalk.green(`Environment selected via prompt: ${chalk.bold(chosenEnv)}`)
      );
    } catch (error) {
      console.error(chalk.red('Error during environment prompt:'), error);
      process.exit(1);
    }
  }

  return chosenEnv;
}

/**
 * Determines the dialect to be used, either from input or via interactive prompt
 */
async function determineDialect(
  dialectInput: DialectKey | undefined
): Promise<DialectKey | undefined> {
  let chosenDialect: DialectKey | undefined;

  if (dialectInput && validDialects.includes(dialectInput as DialectKey)) {
    chosenDialect = dialectInput;
    console.log(
      chalk.green(`Dialect specified via flag: ${chalk.bold(chosenDialect)}`)
    );
  } else {
    try {
      const response = await prompts({
        type: 'select',
        name: 'value',
        message: chalk.blue('Select the target database dialect:'),
        choices: validDialects.map((dialect) => ({
          title: dialect,
          value: dialect,
        })),
      });
      if (!response.value) {
        console.log(chalk.red('\nOperation canceled.'));
        process.exit(0);
      }
      chosenDialect = response.value;
      console.log(
        chalk.green(`Dialect selected via prompt: ${chalk.bold(chosenDialect)}`)
      );
    } catch (error) {
      console.error(chalk.red('Error during dialect prompt:'), error);
      process.exit(1);
    }
  }

  return chosenDialect;
}

/**
 * Sets up the environment variables based on the chosen environment
 */
function setupEnvironment(chosenEnv: EnvironmentKey): void {
  // Set NODE_ENV
  process.env.NODE_ENV = envMap[chosenEnv].value;

  // Determine the specific .env file path
  const envFileName = envMap[chosenEnv].file;
  const specificEnvPath = path.join(projectRoot, envFileName);
  const relativeEnvPath = path.relative(projectRoot, specificEnvPath);

  // Check if the .env file exists and load it
  if (fs.existsSync(specificEnvPath)) {
    console.log(
      chalk.blue(`Loading environment from: ${chalk.bold(relativeEnvPath)}`)
    );
    dotenv.config({
      path: specificEnvPath,
      override: true,
    });
  } else {
    console.warn(
      chalk.yellow(
        `[DEBUG] Warning: Target environment file NOT FOUND at "${specificEnvPath}".`
      )
    );
  }
}

/**
 * Creates a context object with specified dependencies
 */
async function createContext(
  dialect: DialectKey
): Promise<WithClient<CoreContext, 'payment'>> {
  const env = serverEnvSchema.parse(process.env);

  // Validate that Stripe API key is available
  if (!env.STRIPE_SECRET_KEY) {
    console.error(
      chalk.red(
        'Error: STRIPE_SECRET_KEY is not defined in environment variables.'
      )
    );
    console.error(
      chalk.yellow(
        'Please ensure your .env file includes a valid STRIPE_SECRET_KEY.'
      )
    );
    process.exit(1);
  }

  console.log({ POSTGRES_DATABASE_URL: env.POSTGRES_DATABASE_URL });

  // TODO: The dialect property isn't working properly
  // const db = getConnection(env.POSTGRES_DATABASE_URL);
  const db = await getDbConnection(dialect as any, env);
  const stripeClient = createStripeClient(env);

  return {
    logger: createPinoLogger(env),
    payment: { stripeClient },
    db,
    env,
  };
}

/**
 * Prompts user for confirmation when performing dangerous operations in production
 */
async function confirmProductionOperation(
  action: string,
  env: EnvironmentKey
): Promise<boolean> {
  if (env !== 'prod') {
    return true; // No confirmation needed for non-production environments
  }

  console.log(
    chalk.red.bold(
      `\n⚠️  WARNING: You are about to perform a ${action.toUpperCase()} operation on PRODUCTION Stripe!`
    )
  );
  console.log(
    chalk.yellow(
      'This operation may affect the production Stripe configuration.'
    )
  );

  try {
    const response = await prompts({
      type: 'confirm',
      name: 'value',
      message: chalk.red(
        `Are you absolutely sure you want to ${action} in PRODUCTION Stripe?`
      ),
      initial: false, // Default to "No" for safety
    });

    if (!response.value) {
      console.log(chalk.yellow('\nOperation canceled for safety.'));
      return false;
    }

    return true;
  } catch (error) {
    console.error(chalk.red('Error during confirmation prompt:'), error);
    return false;
  }
}

// ------------------ ACTIONS ------------------

/**
 * Ensure Stripe subscription plans (defined in code) exist in Stripe.
 * This action is idempotent.
 */
async function ensurePlansExist(
  // Renamed internal function for clarity
  ctx: WithClient<Pick<CoreContext, 'db' | 'logger'>, 'payment'>,
  env: EnvironmentKey
): Promise<void> {
  try {
    // Check for production confirmation
    if (env === 'prod') {
      const confirmed = await confirmProductionOperation('create plans', env);
      if (!confirmed) {
        process.exit(0);
      }
    }

    // Call the new idempotent function
    await ensureStripeSubscriptionPlans(ctx, { plans: subscriptionPlans });
    ctx.logger.info('Successfully ensured subscription plans exist in Stripe');
  } catch (error) {
    ctx.logger.error(
      'Error ensuring subscription plans exist in Stripe:',
      error
    );
    throw error;
  }
}

/**
 * Archive Stripe subscription plans
 */
async function archivePlans(
  ctx: WithClient<Pick<CoreContext, 'logger'>, 'payment'>,
  env: EnvironmentKey
): Promise<void> {
  // Check for production confirmation
  if (env === 'prod') {
    const confirmed = await confirmProductionOperation('archive plans', env);
    if (!confirmed) {
      process.exit(0);
    }
  }

  const productIdsToDelete = Object.values(BILLING_PRODUCT_IDS);

  try {
    await archiveStripeSubscriptionPlans(ctx, {
      internalProductIds: productIdsToDelete,
    });
    ctx.logger.info('Successfully archived subscription plans');
  } catch (error) {
    ctx.logger.error('Error archiving subscription plans:', error);
    throw error;
  }
}

/**
 * Sync Stripe subscription plans to database
 */
async function syncPlans(
  ctx: WithClient<Pick<CoreContext, 'db' | 'logger'>, 'payment'>
): Promise<void> {
  try {
    await syncStripeSubscriptionPlans(ctx);

    ctx.logger.info(
      'Successfully synced subscription plans from Stripe to database'
    );
  } catch (error) {
    ctx.logger.error('Error syncing subscription plans:', error);
    throw error;
  }
}

/**
 * Update Stripe subscription plans
 */
async function updatePlans(
  ctx: WithClient<Pick<CoreContext, 'logger'>, 'payment'>,
  env: EnvironmentKey
): Promise<void> {
  // Check for production confirmation
  if (env === 'prod') {
    const confirmed = await confirmProductionOperation('update plans', env);
    if (!confirmed) {
      process.exit(0);
    }
  }

  try {
    await updateStripeSubscriptionPlans(ctx, { plans: subscriptionPlans });
    ctx.logger.info('Successfully updated subscription plans');
  } catch (error) {
    ctx.logger.error('Error updating subscription plans:', error);
    throw error;
  }
}

/**
 * Delete subscription plans from database
 */
async function deleteDbPlans(
  ctx: Pick<Context, 'db' | 'logger'>,
  env: EnvironmentKey
): Promise<void> {
  // Check for production confirmation
  if (env === 'prod') {
    const confirmed = await confirmProductionOperation(
      'clear database plans',
      env
    );
    if (!confirmed) {
      process.exit(0);
    }
  }

  try {
    ctx.logger.info('Resetting subscription plans in database...');

    // First delete all prices (due to foreign key constraints)
    await ctx.db.delete(billingPrices);
    ctx.logger.info(
      'Successfully deleted all subscription plan prices from database'
    );

    // Then delete all products
    await ctx.db.delete(billingProducts);
    ctx.logger.info(
      'Successfully deleted all subscription plans from database'
    );

    ctx.logger.info('Database reset completed successfully');
  } catch (error) {
    ctx.logger.error('Error resetting subscription plans in database:', error);
    throw error;
  }
}

/**
 * Show Stripe dashboard URL
 */
async function showStripeDashboardUrl(): Promise<void> {
  console.log(
    chalk.blue(
      'Stripe Dashboard URL: https://dashboard.stripe.com/test/products?active=true'
    )
  );
}

/**
 * List Stripe products
 */
async function listProducts(
  ctx: WithClient<Pick<CoreContext, 'logger'>, 'payment'>
): Promise<void> {
  try {
    const products = await fetchStripeProducts(ctx);

    if (products.length === 0) {
      ctx.logger.info('No products found in Stripe.');
      return;
    }

    ctx.logger.info(`Found ${products.length} products in Stripe:`);
    products.forEach((product) => {
      console.log(chalk.green(`ID: ${chalk.bold(product.id)}`));
      console.log(`  Name: ${product.name}`);
      console.log(`  Active: ${product.active}`);
      console.log(`  Description: ${product.description || 'N/A'}`);
      console.log(
        `  Internal ID: ${product.metadata?.internal_product_id || 'N/A'}`
      );
      console.log('');
    });
  } catch (error) {
    ctx.logger.error('Error listing products:', error);
    throw error;
  }
}

/**
 * List Stripe prices
 */
async function listPrices(
  ctx: WithClient<Pick<CoreContext, 'logger'>, 'payment'>
): Promise<void> {
  try {
    const prices = await fetchStripePrices(ctx);

    if (prices.length === 0) {
      ctx.logger.info('No prices found in Stripe.');
      return;
    }

    ctx.logger.info(`Found ${prices.length} prices in Stripe:`);
    prices.forEach((price) => {
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
    });
  } catch (error) {
    ctx.logger.error('Error listing prices:', error);
    throw error;
  }
}

// ------------------ SETUP COMMANDER ------------------
const program = new Command()
  .name('stripe-actions')
  .description('CLI helper for managing Stripe subscription plans')
  .version('1.0.0');

program
  .argument(
    '[action]',
    'Action to perform (create, archive, sync, update, delete-db, list-products, list-prices)'
  )
  .addOption(
    new Option('-e, --env <name>', 'Specify the target environment').choices(
      validEnvironments
    )
  )
  .addOption(
    new Option('-d, --dialect <name>', 'Specify the database dialect').choices(
      validDialects
    )
  )
  .action(handleAction);

program.addHelpText(
  'after',
  `
  Examples:
    bun run stripe create -e test
    bun run stripe archive -e staging
    bun run stripe sync -e dev
    bun run stripe list-products -e test
    bun run stripe list-prices -e test
    bun run stripe clear-db-plans -d sqlite -e test
    bun run stripe sync -d postgres -e dev
    bun run stripe create -e prod
  `
);

// ------------------ ACTION HANDLER ------------------
async function handleAction(
  actionInput: ActionKey | undefined,
  options: { env?: EnvironmentKey; dialect?: DialectKey }
) {
  // Determine inputs using the helper functions
  const chosenAction = await determineAction(actionInput);

  let chosenEnv: EnvironmentKey | undefined;
  let chosenDialect: DialectKey | undefined;

  const requirements = actionInputRequirements[chosenAction];
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
    setupEnvironment(chosenEnv);
  }

  if (requirements.needsDialect) {
    chosenDialect = await determineDialect(options.dialect);
  }

  try {
    // url doesn't need context
    switch (chosenAction) {
      case 'url':
        return await showStripeDashboardUrl();
      default:
        break;
    }
    // TODO: There shouldn't be a default here
    const ctx = await createContext(chosenDialect || 'postgres');

    switch (chosenAction) {
      case 'create':
        await ensurePlansExist(ctx, chosenEnv!);
        break;
      case 'archive':
        await archivePlans(ctx, chosenEnv!);
        break;
      case 'sync':
        await syncPlans(ctx);
        break;
      case 'update':
        await updatePlans(ctx, chosenEnv!);
        break;
      case 'clear-db-plans':
        await deleteDbPlans(ctx, chosenEnv!);
        break;
      case 'list-products':
        return await listProducts(ctx);
      case 'list-prices':
        return await listPrices(ctx);
      default:
        console.error(
          chalk.red(`Internal error: Unhandled action '${chosenAction}'`)
        );
        process.exit(1);
    }

    console.log(
      chalk.green.bold(
        `\n✅ ${chosenAction.toUpperCase()} action completed successfully!`
      )
    );
  } catch (error) {
    console.error(
      chalk.red(`\n❌ Operation failed during action: ${chosenAction}`)
    );
    process.exit(1);
  }
}

// ------------------ EXECUTE COMMANDER ------------------
program
  .parseAsync(process.argv)
  .catch((error) => {
    console.error(chalk.red('An unexpected error occurred:'), error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
