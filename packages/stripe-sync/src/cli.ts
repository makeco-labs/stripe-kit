#!/usr/bin/env node

import { Command } from "commander"

// Import commands
import { create } from "./commands/create"
import { archive } from "./commands/archive/archive.command"
import { sync } from "./commands/sync"
import { update } from "./commands/update"
import { clearDbPlans } from "./commands/clear-db-plans"
import { url } from "./commands/url"
import { listProducts } from "./commands/list-products"
import { listPrices } from "./commands/list-prices"

// Handle process signals
process.on("SIGINT", () => process.exit(0))
process.on("SIGTERM", () => process.exit(0))

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