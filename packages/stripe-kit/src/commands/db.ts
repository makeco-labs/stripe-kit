import chalk from "chalk";
import { Command, Option } from "commander";

import type { Command as CommandType } from "commander";

import {
  determineAdapter,
  determineEnvironment,
  requireProductionConfirmation,
} from "@/cli-prompts";
import type { Context, EnvironmentKey } from "@/definitions";
import { ENV_CHOICES } from "@/definitions";
import {
  createContext,
  listStripePrices,
  listStripeProducts,
  loadConfig,
  loadEnvironment,
} from "@/utils";

// ========================================================================
// TYPES
// ========================================================================

interface SyncOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

interface SyncPreflightResult {
  ctx: Context;
  chosenEnv: EnvironmentKey;
}

interface PurgeDbOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

interface PurgeDbPreflightResult {
  ctx: Context;
  chosenEnv: EnvironmentKey;
}

// ========================================================================
// SYNC PREFLIGHT
// ========================================================================

async function runSyncPreflight(
  options: SyncOptions,
  command: CommandType,
): Promise<SyncPreflightResult> {
  // Get global config option from root program (traverse up through parent chain)
  const rootProgram = command.parent?.parent;
  const globalOptions = rootProgram?.opts() || {};
  const configPath = globalOptions.config;

  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env });

  // Load environment variables
  loadEnvironment(chosenEnv);

  // Load configuration
  const config = await loadConfig({ configPath });

  // Determine adapter (auto-select if only one)
  const adapterResult = await determineAdapter({
    adapterInput: options.adapter,
    availableAdapters: config.adapters,
  });

  // Create context
  const ctx = createContext({ adapter: adapterResult.adapter, config });

  // Verify Stripe client is available
  if (!ctx.stripeClient) {
    throw new Error(
      "Stripe client not available. Check STRIPE_SECRET_KEY environment variable.",
    );
  }

  // Verify adapter has required methods
  if (
    !(
      typeof ctx.adapter.syncProducts === "function" &&
      typeof ctx.adapter.syncPrices === "function"
    )
  ) {
    throw new Error(
      "Database adapter must implement syncProducts and syncPrices methods",
    );
  }

  // Verify Stripe secret key is configured
  if (!ctx.config.env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured in environment");
  }

  // Production confirmation
  await requireProductionConfirmation({
    action: "sync Stripe plans to database",
    env: chosenEnv,
  });

  return {
    ctx,
    chosenEnv,
  };
}

// ========================================================================
// SYNC ACTION
// ========================================================================

async function syncStripeSubscriptionPlansAction(ctx: Context): Promise<void> {
  ctx.logger.info("Syncing Stripe subscription plans to database...");

  try {
    // Fetch managed products from Stripe (only those managed by this tool)
    ctx.logger.info("Fetching managed products from Stripe...");
    const stripeProducts = await listStripeProducts(ctx, { showAll: false });
    ctx.logger.info(
      `Found ${stripeProducts.length} managed products in Stripe`,
    );

    // Fetch managed prices from Stripe (only those managed by this tool)
    ctx.logger.info("Fetching managed prices from Stripe...");
    const stripePrices = await listStripePrices(ctx, { showAll: false });
    ctx.logger.info(`Found ${stripePrices.length} managed prices in Stripe`);

    // Sync products to database
    ctx.logger.info("Syncing products to database...");
    await ctx.adapter.syncProducts(stripeProducts);
    ctx.logger.info("Products synced successfully");

    // Sync prices to database
    ctx.logger.info("Syncing prices to database...");
    await ctx.adapter.syncPrices(stripePrices);
    ctx.logger.info("Prices synced successfully");

    ctx.logger.info(
      `Successfully synced ${stripeProducts.length} products and ${stripePrices.length} prices from Stripe to database`,
    );
  } catch (error) {
    ctx.logger.error(
      "Error syncing Stripe subscription plans to database:",
      error,
    );
    throw error;
  }
}

// ========================================================================
// PURGE PREFLIGHT
// ========================================================================

async function runPurgeDbPreflight(
  options: PurgeDbOptions,
  command: CommandType,
): Promise<PurgeDbPreflightResult> {
  // Get global config option from root program (traverse up through parent chain)
  const rootProgram = command.parent?.parent;
  const globalOptions = rootProgram?.opts() || {};
  const configPath = globalOptions.config;

  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env });

  // Load environment variables
  loadEnvironment(chosenEnv);

  // Load configuration
  const config = await loadConfig({ configPath });

  // Determine adapter (auto-select if only one)
  const adapterResult = await determineAdapter({
    adapterInput: options.adapter,
    availableAdapters: config.adapters,
  });

  // Create context
  const ctx = createContext({ adapter: adapterResult.adapter, config });

  // Verify adapter has required methods
  if (
    !(
      typeof ctx.adapter.clearProducts === "function" &&
      typeof ctx.adapter.clearPrices === "function"
    )
  ) {
    throw new Error(
      "Database adapter must implement clearProducts and clearPrices methods",
    );
  }

  // Production confirmation
  await requireProductionConfirmation({
    action: "purge database plans",
    env: chosenEnv,
  });

  return {
    ctx,
    chosenEnv,
  };
}

// ========================================================================
// PURGE ACTION
// ========================================================================

async function purgeDbAction(ctx: Context): Promise<void> {
  ctx.logger.info("Clearing subscription plans from database...");

  try {
    // Clear prices first (due to foreign key constraints)
    ctx.logger.info("Clearing prices from database...");
    await ctx.adapter.clearPrices();
    ctx.logger.info("Prices cleared successfully");

    // Clear products
    ctx.logger.info("Clearing products from database...");
    await ctx.adapter.clearProducts();
    ctx.logger.info("Products cleared successfully");

    ctx.logger.info("All subscription plans cleared from database");
  } catch (error) {
    ctx.logger.error("Error clearing subscription plans from database:", error);
    throw error;
  }
}

// ========================================================================
// SUBCOMMANDS
// ========================================================================

const sync = new Command()
  .name("sync")
  .description("Sync Stripe subscription plans to database")
  .addOption(
    new Option("-e, --env <environment>", "Target environment").choices(
      ENV_CHOICES,
    ),
  )
  .option("-a, --adapter <name>", "Database adapter name")
  .action(async (options: SyncOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx } = await runSyncPreflight(options, command);

      // Execute the action
      await syncStripeSubscriptionPlansAction(ctx);

      console.log(chalk.green("\nOperation completed successfully."));

      // Ensure process exits
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });

const purge = new Command()
  .name("purge")
  .description("Delete subscription plans from database")
  .addOption(
    new Option("-e, --env <environment>", "Target environment").choices(
      ENV_CHOICES,
    ),
  )
  .option("-a, --adapter <name>", "Database adapter name")
  .action(async (options: PurgeDbOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx } = await runPurgeDbPreflight(options, command);

      // Execute the action
      await purgeDbAction(ctx);

      console.log(chalk.green("\nOperation completed successfully."));

      // Ensure process exits
      process.exit(0);
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });

// ========================================================================
// COMMAND
// ========================================================================

export const db = new Command()
  .name("db")
  .description("Database operations")
  .addCommand(sync)
  .addCommand(purge)
  .action(() => {
    db.help();
    process.exit(0);
  });
