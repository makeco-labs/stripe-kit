#!/usr/bin/env node

import { Command } from "commander"
import packageJson from "../package.json"

// Import commands
import { create } from "@/src/commands/create"
import { archive } from "@/src/commands/archive" 
import { sync } from "@/src/commands/sync"
import { update } from "@/src/commands/update"
import { clearDbPlans } from "@/src/commands/clear-db-plans"
import { url } from "@/src/commands/url"
import { listProducts } from "@/src/commands/list-products"
import { listPrices } from "@/src/commands/list-prices"

// Handle process signals
process.on("SIGINT", () => process.exit(0))
process.on("SIGTERM", () => process.exit(0))

async function main() {
  const program = new Command()
    .name("stripe-sync")
    .description("CLI to manage Stripe subscription plans")
    .version(
      packageJson.version || "0.1.0",
      "-v, --version",
      "display the version number"
    )

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