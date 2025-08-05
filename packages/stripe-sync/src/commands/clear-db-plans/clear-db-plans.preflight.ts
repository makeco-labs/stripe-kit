import { Command } from 'commander';

import { loadConfig, createContext, loadEnvironment } from '@/utils';
import { determineEnvironment } from '@/cli-prompts/environment';
import { determineAdapter } from '@/cli-prompts/adapter';
import { requireProductionConfirmation } from '@/cli-prompts/confirmation';

import type { Context } from '@/types';
import type { EnvironmentKey } from '@/definitions';

export interface ClearDbPlansOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

export interface ClearDbPlansPreflightResult {
  ctx: Context;
  chosenEnv: EnvironmentKey;
}

export async function runClearDbPlansPreflight(
  options: ClearDbPlansOptions,
  command: Command
): Promise<ClearDbPlansPreflightResult> {
  // Get global config option from parent command
  const globalOptions = command.parent?.opts() || {};
  const configPath = globalOptions.config;

  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env });

  // Load environment variables
  loadEnvironment(chosenEnv);

  // Load configuration
  const config = await loadConfig({ configPath });

  // Determine adapter (auto-select if only one)
  const adapterResult = await determineAdapter({
    adapterInput: options.adapter,
    availableAdapters: config.adapters,
  });

  // Create context
  const ctx = createContext({ adapter: adapterResult.adapter, config });

  // Verify adapter has required methods
  if (!ctx.adapter.clearProducts || !ctx.adapter.clearPrices) {
    throw new Error('Database adapter must implement clearProducts and clearPrices methods');
  }

  // Production confirmation
  await requireProductionConfirmation({
    action: 'clear database plans',
    env: chosenEnv,
  });

  return {
    ctx,
    chosenEnv,
  };
}