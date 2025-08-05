import { Command } from 'commander';

import { loadConfig, createContext, loadEnvironment } from '@/utils';
import { determineEnvironment } from '@/cli-prompts/environment';
import { determineAdapter } from '@/cli-prompts/adapter';
import { requireProductionConfirmation } from '@/cli-prompts/confirmation';

import type { Context } from '@/types';
import type { EnvironmentKey } from '@/definitions';

export interface SyncOptions {
  env?: EnvironmentKey;
  adapter?: string;
}

export interface SyncPreflightResult {
  ctx: Context;
  chosenEnv: EnvironmentKey;
}

export async function runSyncPreflight(
  options: SyncOptions,
  command: Command
): Promise<SyncPreflightResult> {
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

  // Verify Stripe client is available
  if (!ctx.stripeClient) {
    throw new Error('Stripe client not available. Check STRIPE_SECRET_KEY environment variable.');
  }

  // Verify adapter has required methods
  if (!ctx.adapter.syncProducts || !ctx.adapter.syncPrices) {
    throw new Error('Database adapter must implement syncProducts and syncPrices methods');
  }

  // Verify Stripe secret key is configured
  if (!ctx.config.env.stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured in environment');
  }

  // Production confirmation
  await requireProductionConfirmation({
    action: 'sync Stripe plans to database',
    env: chosenEnv,
  });

  return {
    ctx,
    chosenEnv,
  };
}