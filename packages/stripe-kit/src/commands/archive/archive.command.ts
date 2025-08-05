import { Command } from "commander"
import chalk from "chalk"

import { archiveStripeSubscriptionPlans } from "./archive.action"
import { runArchivePreflight, type ArchiveOptions } from "./archive.preflight"

export const archive = new Command()
  .name("archive")
  .description("Archive Stripe subscription plans")
  .option("-e, --env <environment>", "Target environment (test, dev, staging, prod)")
  .option("-a, --adapter <name>", "Database adapter name")
  .action(async (options: ArchiveOptions, command) => {
    try {
      // Run preflight checks and setup
      const { ctx, productIdsToArchive } = await runArchivePreflight(options, command)

      // Execute the action
      await archiveStripeSubscriptionPlans(ctx, {
        internalProductIds: productIdsToArchive,
      })

      console.log(
        chalk.green.bold(`\\n✅ ARCHIVE action completed successfully!`)
      )
    } catch (error) {
      console.error(chalk.red(`\\n❌ Operation failed: ${error}`))
      process.exit(1)
    }
  })