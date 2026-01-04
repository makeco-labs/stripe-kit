import type Stripe from "stripe";
import chalk from "chalk";
import { Command, Option } from "commander";

import type { Command as CommandType } from "commander";

import {
  determineAdapter,
  determineEnvironment,
  requireProductionConfirmation,
} from "@/cli-prompts";
import type { Context, EnvironmentKey, SubscriptionPlan } from "@/definitions";
import { ENV_CHOICES } from "@/definitions";
import {
  createContext,
  findStripePrice,
  findStripeProduct,
  loadConfig,
  loadEnvironment,
} from "@/utils";

// ========================================================================
// TYPES
// ========================================================================

interface CreateOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

interface CreatePreflightResult {
  ctx: Context;
  plans: SubscriptionPlan[];
  chosenEnv: EnvironmentKey;
}

// ========================================================================
// PREFLIGHT
// ========================================================================

async function runCreatePreflight(
  options: CreateOptions,
  command: CommandType,
): Promise<CreatePreflightResult> {
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
    action: "create plans",
    env: chosenEnv,
  });

  return {
    ctx,
    plans: config.plans,
    chosenEnv,
  };
}

// ========================================================================
// HELPER: Build Product Params with Metadata
// ========================================================================

function buildProductParams(
  ctx: Context,
  plan: SubscriptionPlan,
): Stripe.ProductCreateParams {
  const { metadata: metadataConfig } = ctx.config;

  return {
    ...plan.product,
    metadata: {
      ...plan.product.metadata,
      [metadataConfig.productIdField]: plan.id,
      [metadataConfig.managedByField]: metadataConfig.managedByValue,
    },
  };
}

// ========================================================================
// HELPER: Build Price Params with Metadata
// ========================================================================

function buildPriceParams(
  ctx: Context,
  plan: SubscriptionPlan,
  price: SubscriptionPlan["prices"][number],
  stripeProductId: string,
): Stripe.PriceCreateParams {
  const { metadata: metadataConfig } = ctx.config;
  const { id: internalPriceId, ...priceParams } = price;

  return {
    ...priceParams,
    product: stripeProductId,
    metadata: {
      ...priceParams.metadata,
      [metadataConfig.priceIdField]: internalPriceId,
      [metadataConfig.productIdField]: plan.id,
      [metadataConfig.managedByField]: metadataConfig.managedByValue,
    },
  };
}

// ========================================================================
// ACTION
// ========================================================================

async function ensureStripeSubscriptionPlans(
  ctx: Context,
  input: { plans: SubscriptionPlan[] },
): Promise<void> {
  const { plans } = input;
  ctx.logger.info("Ensuring Stripe subscription plans exist...");

  for (const plan of plans) {
    ctx.logger.info(
      `Processing plan: ${plan.product.name} (Internal ID: ${plan.id})...`,
    );
    try {
      // 1. Ensure Product Exists
      let stripeProduct = await findStripeProduct(ctx, {
        internalProductId: plan.id,
      });
      if (stripeProduct) {
        ctx.logger.info(
          `  Product found: ${stripeProduct.name} (ID: ${stripeProduct.id})`,
        );
      } else {
        ctx.logger.info("  Product not found in Stripe, creating...");
        const productParams = buildProductParams(ctx, plan);
        stripeProduct = await ctx.stripeClient.products.create(productParams);
        ctx.logger.info(
          `  Created product: ${stripeProduct?.name} (ID: ${stripeProduct?.id})`,
        );
      }

      // 2. Ensure Prices Exist
      for (const price of plan.prices) {
        let stripePrice = await findStripePrice(ctx, {
          internalPriceId: price.id,
          stripeProductId: stripeProduct.id,
        });
        if (stripePrice) {
          ctx.logger.info(
            `    Price ${price.recurring?.interval ?? "one_time"} found: ID ${stripePrice?.id}`,
          );
        } else {
          ctx.logger.info(
            `    Price ${price.recurring?.interval ?? "one_time"} (Internal ID: ${price.id}) not found, creating...`,
          );
          const priceParams = buildPriceParams(
            ctx,
            plan,
            price,
            stripeProduct.id,
          );
          stripePrice = await ctx.stripeClient.prices.create(priceParams);
          ctx.logger.info(
            `    Created price: ID ${stripePrice?.id} @ $${price.unit_amount ? price.unit_amount / 100 : "variable"}`,
          );
        }
      }
    } catch (error) {
      ctx.logger.error({
        message: "Error ensuring subscription plan/prices in Stripe",
        error,
        metadata: { planId: plan.id, planName: plan.product.name },
      });
      throw error;
    }
  }
  ctx.logger.info("Finished ensuring Stripe subscription plans.");
}

// ========================================================================
// COMMAND
// ========================================================================

export const create = new Command()
  .name("create")
  .description("Create Stripe subscription plans (Idempotent)")
  .addOption(
    new Option("-e, --env <environment>", "Target environment").choices(
      ENV_CHOICES,
    ),
  )
  .option("-a, --adapter <name>", "Database adapter name")
  .action(async (options: CreateOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, plans } = await runCreatePreflight(options, command);

      // Execute the action
      await ensureStripeSubscriptionPlans(ctx, { plans });

      console.log(chalk.green("\nOperation completed successfully."));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });
