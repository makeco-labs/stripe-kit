import { Command } from "commander"
import chalk from "chalk"

import { listStripeProductsAction } from "./list-products.action"
import { runListProductsPreflight, type ListProductsOptions } from "./list-products.preflight"

export const listProducts = new Command()
  .name("list-products")
  .description("List Stripe products")
  .option("-e, --env <environment>", "Target environment (test, dev, staging, prod)")
  .option("--all", "Show all items in Stripe account")
  .action(async (options: ListProductsOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, showAll } = await runListProductsPreflight(options, command)

      // Execute the action
      await listStripeProductsAction(ctx, { showAll })

      console.log(
        chalk.green.bold(`\\n✅ LIST-PRODUCTS action completed successfully!`)
      )
    } catch (error) {
      console.error(chalk.red(`\\n❌ Operation failed: ${error}`))
      process.exit(1)
    }
  })