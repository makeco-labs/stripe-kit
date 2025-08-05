import { Command } from "commander"
import chalk from "chalk"

import { ensureStripeSubscriptionPlans } from "../actions"
import { loadConfig } from "../config"
import { createContext } from "../utils/create-context"
import { loadEnvironment } from "../utils/load-env"
import { determineEnvironment } from "../cli-prompts/environment"
import { determineAdapter } from "../cli-prompts/adapter"
import { requireProductionConfirmation } from "../cli-prompts/confirmation"

import type { EnvironmentKey } from "../definitions"

interface CreateOptions {
  env?: EnvironmentKey
  adapter?: string
}

export const create = new Command()
  .name("create")
  .description("Create Stripe subscription plans (Idempotent)")
  .option("-e, --env <environment>", "Target environment (test, dev, staging, prod)")
  .option("-a, --adapter <name>", "Database adapter name")
  .action(async (options: CreateOptions, command) => {
    try {
      // Get global config option from parent command
      const globalOptions = command.parent?.opts() || {}
      const configPath = globalOptions.config

      // Determine environment
      const chosenEnv = await determineEnvironment({ envInput: options.env })

      // Load environment variables
      loadEnvironment(chosenEnv)

      // Load configuration
      const config = await loadConfig({ configPath })

      // Determine adapter (auto-select if only one)
      const adapterResult = await determineAdapter({
        adapterInput: options.adapter,
        availableAdapters: config.adapters,
      })

      // Create context
      const ctx = createContext({ adapter: adapterResult.adapter, config })

      // Production confirmation
      await requireProductionConfirmation({
        action: "create plans",
        env: chosenEnv,
      })

      // Execute the action
      await ensureStripeSubscriptionPlans(ctx, { plans: config.plans })

      console.log(
        chalk.green.bold(`\\n✅ CREATE action completed successfully!`)
      )
    } catch (error) {
      console.error(chalk.red(`\\n❌ Operation failed: ${error}`))
      process.exit(1)
    }
  })