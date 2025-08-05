#!/usr/bin/env node

import { Command } from "commander"

// Import all commands from barrel export
import {
  create,
  archive,
  config,
  sync,
  update,
  clearDbPlans,
  urls,
  listProducts,
  listPrices
} from "./commands"

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
    .name("stripe-kit")
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
    .addCommand(config)
    .addCommand(sync)
    .addCommand(update)
    .addCommand(clearDbPlans)
    .addCommand(urls)
    .addCommand(listProducts)
    .addCommand(listPrices)

  program.parse()
}

main()