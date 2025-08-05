import { Command } from "commander"
import chalk from "chalk"

import { showStripeDashboardUrl } from "../actions"

export const url = new Command()
  .name("url")
  .description("Show Stripe dashboard URL")
  .action(async () => {
    try {
      await showStripeDashboardUrl()
      console.log(
        chalk.green.bold(`\\n✅ URL action completed successfully!`)
      )
    } catch (error) {
      console.error(chalk.red(`\\n❌ Operation failed: ${error}`))
      process.exit(1)
    }
  })