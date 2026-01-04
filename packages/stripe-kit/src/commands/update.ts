import chalk from "chalk";
import { Command, Option } from "commander";

import type { Command as CommandType } from "commander";
import type Stripe from "stripe";

import {
  determineAdapter,
  determineEnvironment,
  requireProductionConfirmation,
} from "@/cli-prompts";
import type { Context, EnvironmentKey, SubscriptionPlan } from "@/definitions";
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

interface UpdateOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

interface UpdatePreflightResult {
  ctx: Context;
  chosenEnv: EnvironmentKey;
}

// ========================================================================
// PREFLIGHT
// ========================================================================

async function runUpdatePreflight(
  options: UpdateOptions,
  command: CommandType,
): Promise<UpdatePreflightResult> {
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

  // Verify Stripe client is available
  if (!ctx.stripeClient) {
    throw new Error(
      "Stripe client not available. Check STRIPE_SECRET_KEY environment variable.",
    );
  }

  // Verify Stripe secret key is configured
  if (!ctx.config.env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured in environment");
  }

  // Verify plans are configured
  if (!ctx.config.plans || ctx.config.plans.length === 0) {
    throw new Error(
      "No subscription plans configured. Check your config file.",
    );
  }

  // Production confirmation
  await requireProductionConfirmation({
    action: "update Stripe plans",
    env: chosenEnv,
  });

  return {
    ctx,
    chosenEnv,
  };
}

// ========================================================================
// HELPER: Build Product Update Params
// ========================================================================

function buildProductUpdateParams(
  ctx: Context,
  plan: SubscriptionPlan,
): Stripe.ProductUpdateParams {
  const { metadata: metadataConfig } = ctx.config;

  return {
    name: plan.product.name,
    description: plan.product.description,
    active: plan.product.active,
    metadata: {
      ...plan.product.metadata,
      [metadataConfig.productIdField]: plan.id,
      [metadataConfig.managedByField]: metadataConfig.managedByValue,
    },
  };
}

// ========================================================================
// HELPER: Build Price Update Params
// ========================================================================

function buildPriceUpdateParams(
  ctx: Context,
  plan: SubscriptionPlan,
  price: SubscriptionPlan["prices"][number],
): Stripe.PriceUpdateParams {
  const { metadata: metadataConfig } = ctx.config;

  return {
    active: price.active,
    metadata: {
      ...price.metadata,
      [metadataConfig.priceIdField]: price.id,
      [metadataConfig.productIdField]: plan.id,
      [metadataConfig.managedByField]: metadataConfig.managedByValue,
    },
  };
}

// ========================================================================
// ACTION
// ========================================================================

// ------------------ Update Stripe Product ------------------

async function updateStripeProduct(
  ctx: Context,
  plan: SubscriptionPlan,
  allStripeProducts: Stripe.Product[],
): Promise<void> {
  try {
    // Find the product that matches our internal ID
    const stripeProduct = allStripeProducts.find(
      (product) =>
        product.metadata?.[ctx.config.metadata.productIdField] === plan.id &&
        product.metadata?.[ctx.config.metadata.managedByField] ===
          ctx.config.metadata.managedByValue,
    );

    if (!stripeProduct) {
      ctx.logger.warn(
        `Stripe product not found for ${plan.id}. Skipping update.`,
      );
      return;
    }

    // Build update params
    const updateParams = buildProductUpdateParams(ctx, plan);

    // Update the product
    await ctx.stripeClient.products.update(stripeProduct.id, updateParams);

    ctx.logger.info(`Updated Stripe product: ${stripeProduct.id}`);
  } catch (error) {
    ctx.logger.error({
      message: "Error updating Stripe product",
      error,
      productId: plan.id,
    });
    throw new Error(`Failed to update Stripe product: ${error}`);
  }
}

// ------------------ Update Stripe Prices ------------------

async function updateStripePrices(
  ctx: Context,
  plan: SubscriptionPlan,
  allStripePrices: Stripe.Price[],
): Promise<void> {
  try {
    // For each price in the plan
    for (const planPrice of plan.prices) {
      // Find matching Stripe price by internal ID
      const stripePrice = allStripePrices.find(
        (price) =>
          price.metadata?.[ctx.config.metadata.priceIdField] === planPrice.id &&
          price.metadata?.[ctx.config.metadata.managedByField] ===
            ctx.config.metadata.managedByValue,
      );

      if (!stripePrice) {
        ctx.logger.warn(
          `Stripe price not found for ${planPrice.id}. Skipping update.`,
        );
        continue;
      }

      // Build update params
      const updateParams = buildPriceUpdateParams(ctx, plan, planPrice);

      // Update the price
      await ctx.stripeClient.prices.update(stripePrice.id, updateParams);

      ctx.logger.info(`Updated Stripe price: ${stripePrice.id}`);
    }
  } catch (error) {
    ctx.logger.error({
      message: "Error updating Stripe prices",
      error,
      planId: plan.id,
    });
    throw new Error(`Failed to update Stripe prices: ${error}`);
  }
}

// ------------------ Update Stripe Subscription Plans Action ------------------

async function updateStripeSubscriptionPlansAction(
  ctx: Context,
): Promise<void> {
  const plans = ctx.config.plans;

  ctx.logger.info(`Updating ${plans.length} subscription plans in Stripe...`);

  try {
    // Fetch all managed products and prices once to avoid multiple API calls
    const allStripeProducts = await listStripeProducts(ctx, { showAll: false });
    const allStripePrices = await listStripePrices(ctx, { showAll: false });

    ctx.logger.info(
      `Found ${allStripeProducts.length} managed products and ${allStripePrices.length} managed prices in Stripe`,
    );

    // Update each plan
    for (const plan of plans) {
      ctx.logger.info(
        `Updating plan: ${plan.product.name} (Internal ID: ${plan.id})...`,
      );

      // Update the product
      await updateStripeProduct(ctx, plan, allStripeProducts);

      // Update the prices
      await updateStripePrices(ctx, plan, allStripePrices);
    }

    ctx.logger.info("Finished updating subscription plans in Stripe");
  } catch (error) {
    ctx.logger.error("Error updating Stripe subscription plans:", error);
    throw error;
  }
}

// ========================================================================
// COMMAND
// ========================================================================

export const update = new Command()
  .name("update")
  .description("Update Stripe subscription plans")
  .addOption(
    new Option("-e, --env <environment>", "Target environment").choices(
      ENV_CHOICES,
    ),
  )
  .option("-a, --adapter <name>", "Database adapter name")
  .action(async (options: UpdateOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx } = await runUpdatePreflight(options, command);

      // Execute the action
      await updateStripeSubscriptionPlansAction(ctx);

      console.log(chalk.green("\nOperation completed successfully."));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
