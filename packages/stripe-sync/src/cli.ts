#!/usr/bin/env node

import { Command } from "commander"

// Import commands
import { create } from "./commands/create/create.command"
import { archive } from "./commands/archive/archive.command"
import { sync } from "./commands/sync/sync.command"
import { update } from "./commands/update/update.command"
import { clearDbPlans } from "./commands/clear-db-plans/clear-db-plans.command"
import { url } from "./commands/url/url.command"
import { listProducts } from "./commands/list-products/list-products.command"
import { listPrices } from "./commands/list-prices/list-prices.command"

// Handle process signals (simple and reliable)
process.on("SIGINT", () => process.exit(0))
process.on("SIGTERM", () => process.exit(0))

// Handle basic errors (no fancy cleanup)
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection:', reason)
  process.exit(1)
})

const packageVersion = "0.1.0";

async function main() {
  const program = new Command()
    .name("stripe-sync")
    .description("CLI to manage Stripe subscription plans")
    .version(
      packageVersion,
      "-v, --version",
      "display the version number"
    )
    .option("-c, --config <path>", "Path to stripe.config.ts file (defaults to ./stripe.config.ts)")

  // Add all commands
  program
    .addCommand(create)
    .addCommand(archive)
    .addCommand(sync)
    .addCommand(update)
    .addCommand(clearDbPlans)
    .addCommand(url)
    .addCommand(listProducts)
    .addCommand(listPrices)

  program.parse()
}

main()