import { Command } from "commander"
import chalk from "chalk"

import { ensureStripeSubscriptionPlans } from "./create.action"
import { runCreatePreflight, type CreateOptions } from "./create.preflight"

export const create = new Command()
  .name("create")
  .description("Create Stripe subscription plans (Idempotent)")
  .option("-e, --env <environment>", "Target environment (test, dev, staging, prod)")
  .option("-a, --adapter <name>", "Database adapter name")
  .action(async (options: CreateOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, plans } = await runCreatePreflight(options, command)

      // Execute the action
      await ensureStripeSubscriptionPlans(ctx, { plans })

      console.log(
        chalk.green.bold(`\\n✅ CREATE action completed successfully!`)
      )
    } catch (error) {
      console.error(chalk.red(`\\n❌ Operation failed: ${error}`))
      process.exit(1)
    }
  })