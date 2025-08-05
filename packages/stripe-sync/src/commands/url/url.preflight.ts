import { Command } from 'commander';

import { loadConfig, createContext, loadEnvironment } from '@/utils';
import { determineEnvironment } from '@/cli-prompts/environment';
import { determineAdapter } from '@/cli-prompts/adapter';

import type { Context } from '@/types';
import type { EnvironmentKey } from '@/definitions';

export interface UrlOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

export interface UrlPreflightResult {
  ctx: Context;
  chosenEnv: EnvironmentKey;
}

export async function runUrlPreflight(
  options: UrlOptions,
  command: Command
): Promise<UrlPreflightResult> {
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

  // URL command doesn't need special validations - just basic context
  ctx.logger.debug('URL command preflight checks passed');

  return {
    ctx,
    chosenEnv,
  };
}