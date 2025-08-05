import { Command } from "commander"

import { loadConfig } from "@/config"
import { createContext } from "@/utils/create-context"
import { loadEnvironment } from "@/utils/load-env"
import { determineEnvironment } from "@/cli-prompts/environment"
import { determineAdapter } from "@/cli-prompts/adapter"
import { requireProductionConfirmation } from "@/cli-prompts/confirmation"

import type { Context } from "@/types"
import type { EnvironmentKey } from "@/definitions"
import type { SubscriptionPlan } from "@/schemas"

export interface CreateOptions {
  env?: EnvironmentKey
  adapter?: string
}

export interface CreatePreflightResult {
  ctx: Context
  plans: SubscriptionPlan[]
  chosenEnv: EnvironmentKey
}

export async function runCreatePreflight(
  options: CreateOptions,
  command: Command
): Promise<CreatePreflightResult> {
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

  return {
    ctx,
    plans: config.plans,
    chosenEnv,
  }
}