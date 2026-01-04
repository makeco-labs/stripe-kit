import chalk from "chalk";
import { Command, Option } from "commander";

import type { Command as CommandType } from "commander";

import { determineEnvironment } from "@/cli-prompts";
import type { Context, DatabaseAdapter, EnvironmentKey } from "@/definitions";
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

interface ListProductsOptions {
  env?: EnvironmentKey;
  all?: boolean;
}

interface ListProductsPreflightResult {
  ctx: Context;
  showAll: boolean;
  chosenEnv: EnvironmentKey;
}

interface ListPricesOptions {
  env?: EnvironmentKey;
  all?: boolean;
}

interface ListPricesPreflightResult {
  ctx: Context;
  showAll: boolean;
  chosenEnv: EnvironmentKey;
}

// ========================================================================
// PRODUCTS PREFLIGHT
// ========================================================================

async function runListProductsPreflight(
  options: ListProductsOptions,
  command: CommandType,
): Promise<ListProductsPreflightResult> {
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

  // Create context without specific adapter (doesn't need database)
  const ctx = createContext({
    adapter: Object.values(config.adapters)[0] as DatabaseAdapter,
    config,
  });

  return {
    ctx,
    showAll: !!options.all,
    chosenEnv,
  };
}

// ========================================================================
// PRODUCTS ACTION
// ========================================================================

async function listStripeProductsAction(
  ctx: Context,
  options: { showAll?: boolean } = {},
): Promise<void> {
  const { showAll = false } = options;

  try {
    const products = await listStripeProducts(ctx, { showAll });

    if (products.length === 0) {
      ctx.logger.info("No products found in Stripe.");
      return;
    }

    ctx.logger.info(
      `Found ${products.length} ${showAll ? "" : "managed "}products in Stripe:`,
    );
    for (const product of products) {
      const isManaged =
        product.metadata?.[ctx.config.metadata.productIdField] &&
        product.metadata?.[ctx.config.metadata.managedByField] ===
          ctx.config.metadata.managedByValue;

      console.log(`${chalk.bold(product.id)}`);
      console.log(`  ${chalk.dim("Name:")} ${product.name}`);
      console.log(`  ${chalk.dim("Active:")} ${product.active}`);
      console.log(
        `  ${chalk.dim("Description:")} ${product.description || "N/A"}`,
      );
      console.log(
        `  ${chalk.dim("Internal ID:")} ${product.metadata?.[ctx.config.metadata.productIdField] || "N/A"}`,
      );

      if (showAll) {
        console.log(
          `  Managed: ${isManaged ? chalk.green("Yes") : chalk.yellow("No")}`,
        );
      }

      console.log("");
    }
  } catch (error) {
    ctx.logger.error("Error listing products:", error);
    throw error;
  }
}

// ========================================================================
// PRICES PREFLIGHT
// ========================================================================

async function runListPricesPreflight(
  options: ListPricesOptions,
  command: CommandType,
): Promise<ListPricesPreflightResult> {
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

  // Create context without specific adapter (doesn't need database)
  const ctx = createContext({
    adapter: Object.values(config.adapters)[0] as DatabaseAdapter,
    config,
  });

  return {
    ctx,
    showAll: !!options.all,
    chosenEnv,
  };
}

// ========================================================================
// PRICES ACTION
// ========================================================================

async function listStripePricesAction(
  ctx: Context,
  options: { showAll?: boolean } = {},
): Promise<void> {
  const { showAll = false } = options;

  try {
    const prices = await listStripePrices(ctx, { showAll });

    if (prices.length === 0) {
      ctx.logger.info("No prices found in Stripe.");
      return;
    }

    ctx.logger.info(
      `Found ${prices.length} ${showAll ? "" : "managed "}prices in Stripe:`,
    );
    for (const price of prices) {
      const isManaged =
        price.metadata?.[ctx.config.metadata.priceIdField] &&
        price.metadata?.[ctx.config.metadata.managedByField] ===
          ctx.config.metadata.managedByValue;

      console.log(`${chalk.bold(price.id)}`);
      console.log(`  ${chalk.dim("Product:")} ${price.product}`);
      console.log(`  ${chalk.dim("Active:")} ${price.active}`);
      console.log(
        `  ${chalk.dim("Currency:")} ${price.currency.toUpperCase()}`,
      );
      console.log(`  ${chalk.dim("Type:")} ${price.type}`);

      if (price.type === "recurring") {
        console.log(`  ${chalk.dim("Interval:")} ${price.recurring?.interval}`);
        console.log(
          `  ${chalk.dim("Interval Count:")} ${price.recurring?.interval_count}`,
        );
      }

      if (typeof price.unit_amount === "number") {
        console.log(
          `  ${chalk.dim("Amount:")} ${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`,
        );
      }

      console.log(
        `  ${chalk.dim("Internal ID:")} ${price.metadata?.[ctx.config.metadata.priceIdField] || "N/A"}`,
      );

      if (showAll) {
        console.log(
          `  Managed: ${isManaged ? chalk.green("Yes") : chalk.yellow("No")}`,
        );
      }

      console.log("");
    }
  } catch (error) {
    ctx.logger.error("Error listing prices:", error);
    throw error;
  }
}

// ========================================================================
// SUBCOMMANDS
// ========================================================================

const products = new Command()
  .name("products")
  .description("List Stripe products")
  .addOption(
    new Option("-e, --env <environment>", "Target environment").choices(
      ENV_CHOICES,
    ),
  )
  .option("--all", "Show all items in Stripe account")
  .action(async (options: ListProductsOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, showAll } = await runListProductsPreflight(options, command);

      // Execute the action
      await listStripeProductsAction(ctx, { showAll });

      console.log(chalk.green("\nOperation completed successfully."));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });

const prices = new Command()
  .name("prices")
  .description("List Stripe prices")
  .addOption(
    new Option("-e, --env <environment>", "Target environment").choices(
      ENV_CHOICES,
    ),
  )
  .option("--all", "Show all items in Stripe account")
  .action(async (options: ListPricesOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, showAll } = await runListPricesPreflight(options, command);

      // Execute the action
      await listStripePricesAction(ctx, { showAll });

      console.log(chalk.green("\nOperation completed successfully."));
    } catch (error) {
      console.error(chalk.red(`\nOperation failed: ${error}`));
      process.exit(1);
    }
  });

// ========================================================================
// COMMAND
// ========================================================================

export const list = new Command()
  .name("list")
  .description("List Stripe resources")
  .addCommand(products)
  .addCommand(prices)
  .action(() => {
    list.help();
    process.exit(0);
  });
