import { Command } from "commander"
import chalk from "chalk"

import { listStripeProductsAction } from "../actions"
import { loadConfig } from "../config"
import { createContext } from "../utils/create-context"
import { loadEnvironment } from "../utils/load-env"
import { determineEnvironment } from "../cli-prompts/environment"

import type { EnvironmentKey } from "../definitions"

interface ListProductsOptions {
  config?: string
  env?: EnvironmentKey
  all?: boolean
}

export const listProducts = new Command()
  .name("list-products")
  .description("List Stripe products")
  .option("-c, --config <path>", "Path to stripe.config.ts file")
  .option("-e, --env <environment>", "Target environment (test, dev, staging, prod)")
  .option("--all", "Show all items in Stripe account")
  .action(async (options: ListProductsOptions) => {
    try {
      // Determine environment
      const chosenEnv = await determineEnvironment({ envInput: options.env })

      // Load environment variables
      loadEnvironment(chosenEnv)

      // Load configuration
      const config = await loadConfig({ configPath: options.config })

      // Create context without adapter (doesn't need database)
      const ctx = createContext({ adapter: Object.values(config.adapters)[0], config })

      // Execute the action
      await listStripeProductsAction(ctx, { showAll: options.all })

      console.log(
        chalk.green.bold(`\\n✅ LIST-PRODUCTS action completed successfully!`)
      )
    } catch (error) {
      console.error(chalk.red(`\\n❌ Operation failed: ${error}`))
      process.exit(1)
    }
  })