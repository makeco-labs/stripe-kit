import type { Command } from "commander";
import {
	determineAdapter,
	determineEnvironment,
	requireProductionConfirmation,
} from "@/cli-prompts";
import type { Context, EnvironmentKey } from "@/definitions";
import { createContext, loadConfig, loadEnvironment } from "@/utils";

export interface UpdateOptions {
	env?: EnvironmentKey;
	adapter?: string;
}

export interface UpdatePreflightResult {
	ctx: Context;
	chosenEnv: EnvironmentKey;
}

export async function runUpdatePreflight(
	options: UpdateOptions,
	command: Command,
): Promise<UpdatePreflightResult> {
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
		throw new Error(
			"Stripe client not available. Check STRIPE_SECRET_KEY environment variable.",
		);
	}

	// Verify Stripe secret key is configured
	if (!ctx.config.env.stripeSecretKey) {
		throw new Error("STRIPE_SECRET_KEY is not configured in environment");
	}

	// Verify plans are configured
	if (!ctx.config.plans || ctx.config.plans.length === 0) {
		throw new Error(
			"No subscription plans configured. Check your config file.",
		);
	}

	// Verify mappers are available
	if (
		!ctx.mappers.mapSubscriptionPlanToStripeProduct ||
		!ctx.mappers.mapSubscriptionPlanToStripePrice
	) {
		throw new Error("Stripe mappers not available. Check your configuration.");
	}

	// Production confirmation
	await requireProductionConfirmation({
		action: "update Stripe plans",
		env: chosenEnv,
	});

	return {
		ctx,
		chosenEnv,
	};
}
