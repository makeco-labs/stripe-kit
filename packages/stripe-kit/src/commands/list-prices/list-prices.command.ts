import { Command } from "commander"
import chalk from "chalk"

import { listStripePricesAction } from "./list-prices.action"
import { runListPricesPreflight, type ListPricesOptions } from "./list-prices.preflight"

export const listPrices = new Command()
  .name("list-prices")
  .description("List Stripe prices")
  .option("-e, --env <environment>", "Target environment (test, dev, staging, prod)")
  .option("--all", "Show all items in Stripe account")
  .action(async (options: ListPricesOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, showAll } = await runListPricesPreflight(options, command)

      // Execute the action
      await listStripePricesAction(ctx, { showAll })

      console.log(
        chalk.green.bold(`\\n✅ LIST-PRICES action completed successfully!`)
      )
    } catch (error) {
      console.error(chalk.red(`\\n❌ Operation failed: ${error}`))
      process.exit(1)
    }
  })