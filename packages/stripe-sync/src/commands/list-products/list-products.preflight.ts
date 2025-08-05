import { Command } from "commander"

import { loadConfig } from "@/config"
import { createContext } from "@/utils/create-context"
import { loadEnvironment } from "@/utils/load-env"
import { determineEnvironment } from "@/cli-prompts/environment"

import type { Context } from "@/types"
import type { EnvironmentKey } from "@/definitions"

export interface ListProductsOptions {
  env?: EnvironmentKey
  all?: boolean
}

export interface ListProductsPreflightResult {
  ctx: Context
  showAll: boolean
  chosenEnv: EnvironmentKey
}

export async function runListProductsPreflight(
  options: ListProductsOptions,
  command: Command
): Promise<ListProductsPreflightResult> {
  // Get global config option from parent command
  const globalOptions = command.parent?.opts() || {}
  const configPath = globalOptions.config

  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env })

  // Load environment variables
  loadEnvironment(chosenEnv)

  // Load configuration
  const config = await loadConfig({ configPath })

  // Create context without specific adapter (doesn't need database)
  const ctx = createContext({ adapter: Object.values(config.adapters)[0], config })

  return {
    ctx,
    showAll: options.all || false,
    chosenEnv,
  }
}