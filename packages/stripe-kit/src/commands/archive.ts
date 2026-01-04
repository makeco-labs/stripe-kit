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
  findStripeProduct,
  listStripePrices,
  loadConfig,
  loadEnvironment,
} from "@/utils";

// ========================================================================
// TYPES
// ========================================================================

interface ArchiveOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

interface ArchivePreflightResult {
  ctx: Context;
  productIdsToArchive: string[];
  chosenEnv: EnvironmentKey;
}

// ========================================================================
// PREFLIGHT
// ========================================================================

async function runArchivePreflight(
  options: ArchiveOptions,
  command: CommandType,
): Promise<ArchivePreflightResult> {
  // Get global config option from parent command
  const globalOptions = command.parent?.opts() || {};
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

  // Production confirmation
  await requireProductionConfirmation({
    action: "archive plans",
    env: chosenEnv,
  });

  // Get product IDs to archive
  const productIdsToArchive = config.productIds
    ? Object.values(config.productIds)
    : config.plans.map((plan) => plan.id);

  return {
    ctx,
    productIdsToArchive,
    chosenEnv,
  };
}

// ========================================================================
// ACTION
// ========================================================================

// ------------------ Archive Stripe Products ------------------

async function archiveStripeProducts(
  ctx: Context,
  input: {
    internalProductIds: string[];
  },
): Promise<void> {
  const { internalProductIds } = input;

  if (!internalProductIds.length) {
    ctx.logger.info("No product IDs provided for archiving");
    return;
  }

  let archivedCount = 0;

  for (const internalProductId of internalProductIds) {
    try {
      const product = await findStripeProduct(ctx, { internalProductId });

      if (!product) {
        ctx.logger.info(`Product not found in Stripe: ${internalProductId}`);
        continue;
      }

      await ctx.stripeClient.products.update(product.id, {
        active: false,
      });
      ctx.logger.info(
        `Archived product in Stripe: ${product.id} (Internal ID: ${internalProductId})`,
      );
      archivedCount++;
    } catch (error) {
      ctx.logger.error({
        message: "Error archiving product in Stripe",
        error,
        internalProductId,
      });
    }
  }

  if (archivedCount === 0) {
    ctx.logger.info("No products were archived in Stripe");
  }
}

// ------------------ Archive Stripe Prices ------------------

async function archiveStripePrices(
  ctx: Context,
  input: {
    internalProductIds: string[];
  },
): Promise<void> {
  const { internalProductIds } = input;

  if (!internalProductIds.length) {
    ctx.logger.info("No product IDs provided for archiving");
    return;
  }

  const prices = await listStripePrices(ctx, { showAll: false });
  const pricesToArchive = prices.filter((price) =>
    internalProductIds.includes(
      price.metadata?.[ctx.config.metadata.productIdField] ?? "",
    ),
  );

  if (pricesToArchive.length === 0) {
    ctx.logger.info("No prices to archive in Stripe");
    return;
  }

  for (const price of pricesToArchive) {
    try {
      await ctx.stripeClient.prices.update(price.id, {
        active: false,
      });
      ctx.logger.info(`Archived price in Stripe: ${price.id}`);
    } catch (error) {
      ctx.logger.error({
        message: "Error archiving price in Stripe",
        error,
        priceId: price.id,
      });
    }
  }
}

// ------------------ Archive Stripe Pricing Plans ------------------

async function archiveStripePricingPlans(
  ctx: Context,
  input: {
    internalProductIds: string[];
  },
): Promise<void> {
  const { internalProductIds } = input;

  if (internalProductIds.length === 0) {
    ctx.logger.info("No product IDs provided for archiving");
    return;
  }

  ctx.logger.info(
    `Archiving ${internalProductIds.length} pricing plans in Stripe...`,
  );

  await archiveStripeProducts(ctx, { internalProductIds });
  await archiveStripePrices(ctx, { internalProductIds });

  ctx.logger.info(
    `Successfully archived ${internalProductIds.length} pricing plans in Stripe`,
  );
}

// ========================================================================
// COMMAND
// ========================================================================

export const archive = new Command()
  .name("archive")
  .description("Archive Stripe pricing plans")
  .addOption(
    new Option("-e, --env <environment>", "Target environment").choices(
      ENV_CHOICES,
    ),
  )
  .option("-a, --adapter <name>", "Database adapter name")
  .action(async (options: ArchiveOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, productIdsToArchive } = await runArchivePreflight(
        options,
        command,
      );

      // Execute the action
      await archiveStripePricingPlans(ctx, {
        internalProductIds: productIdsToArchive,
      });

      console.log(chalk.green("\nOperation completed successfully."));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
