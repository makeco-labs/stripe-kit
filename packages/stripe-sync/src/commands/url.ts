import { Command } from "commander"
import chalk from "chalk"

/**
 * Shows the Stripe dashboard URL
 */
function showStripeDashboardUrl(): void {
  console.log(
    chalk.blue(
      'Stripe Dashboard URL: https://dashboard.stripe.com/test/products?active=true'
    )
  );
}

export const url = new Command()
  .name("url")
  .description("Show Stripe dashboard URL")
  .action(async () => {
    try {
      showStripeDashboardUrl()
      console.log(
        chalk.green.bold(`\\n✅ URL action completed successfully!`)
      )
    } catch (error) {
      console.error(chalk.red(`\\n❌ Operation failed: ${error}`))
      process.exit(1)
    }
  })