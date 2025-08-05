#!/usr/bin/env node

import assert from "node:assert/strict";
import chalk from "chalk";
import { Command, Option } from "commander";

import {
	archiveStripeSubscriptionPlans,
	ensureStripeSubscriptionPlans,
	listStripePricesAction,
	listStripeProductsAction,
	showStripeDashboardUrl,
} from "../actions";
import { loadConfig } from "../config";
import { createContext } from "./context";
import {
	ACTION_REQUIREMENTS,
	ACTIONS,
	VALID_ENVIRONMENTS,
} from "./definitions";
import { loadEnvironment } from "./environment";
import {
	requireProductionConfirmation,
	determineAction,
	determineAdapter,
	determineEnvironment,
} from "./prompts";
import { setupSignalHandlers } from "./signals";

import type { DatabaseAdapter, Config } from "../schemas";
import type { ActionKey, CliOptions, EnvironmentKey } from "./definitions";

// ========================================================================
// SETUP
// ========================================================================

// Setup signal handlers
setupSignalHandlers();

// ========================================================================
// ACTION EXECUTION
// ========================================================================

async function executeAction(input: {
	action: ActionKey;
	config: Config;
	env?: EnvironmentKey;
	adapter?: DatabaseAdapter;
	showAll?: boolean;
}): Promise<void> {
	const { action, config, env, adapter, showAll } = input;

	// url doesn't need context
	if (action === ACTIONS.URL) {
		return showStripeDashboardUrl();
	}

	if (!adapter) {
		console.error(
			chalk.red(
				"❌ Error: This action requires a database adapter. Please specify one with --adapter flag or configure adapters in your config file.",
			),
		);
		process.exit(1);
	}

	const ctx = createContext({ adapter, config });

	// Assert that env is defined for actions that need it
	assert(env !== undefined, "Environment must be defined for this action");

	switch (action) {
		case ACTIONS.CREATE:
			await requireProductionConfirmation({
				action: "create plans",
				env,
			});
			await ensureStripeSubscriptionPlans(ctx, { plans: config.plans });
			break;
		case ACTIONS.ARCHIVE: {
			await requireProductionConfirmation({
				action: "archive plans",
				env,
			});
			const productIdsToArchive = config.productIds
				? Object.values(config.productIds)
				: config.plans.map((plan) => plan.product.id);
			await archiveStripeSubscriptionPlans(ctx, {
				internalProductIds: productIdsToArchive,
			});
			break;
		}
		case ACTIONS.SYNC:
			// TODO: Implement sync with adapter
			ctx.logger.info("Sync operation not yet implemented");
			break;
		case ACTIONS.UPDATE:
			// TODO: Implement update
			ctx.logger.info("Update operation not yet implemented");
			break;
		case ACTIONS.CLEAR_DB_PLANS:
			// TODO: Implement clear-db-plans with adapter
			ctx.logger.info("Clear DB plans operation not yet implemented");
			break;
		case ACTIONS.LIST_PRODUCTS:
			return await listStripeProductsAction(ctx, { showAll });
		case ACTIONS.LIST_PRICES:
			return await listStripePricesAction(ctx, { showAll });
		default:
			console.error(chalk.red(`Internal error: Unhandled action '${action}'`));
			process.exit(1);
	}
}

// ========================================================================
// CLI SETUP
// ========================================================================

// Create the CLI program
const program = new Command()
	.name("stripe-sync")
	.description("CLI to manage Stripe subscription plans")
	.version("0.1.0");

program
	.argument(
		"[action]",
		"Action to perform (create, archive, sync, update, clear-db-plans, list-products, list-prices)",
	)
	.option("-c, --config <path>", "Path to stripe.config.ts file")
	.addOption(
		new Option("-e, --env <name>", "Specify the target environment").choices(
			VALID_ENVIRONMENTS,
		),
	)
	.addOption(
		new Option(
			"-a, --adapter <name>",
			"Specify the database adapter (choices depend on your config)",
		),
	)
	.option(
		"--all",
		"Show all items in Stripe account (applies to list operations only)",
	)
	.action(async (actionInput: ActionKey | undefined, options: CliOptions) => {
		try {
			const chosenAction = await determineAction({ actionInput });

			let chosenEnv: EnvironmentKey | undefined;
			let selectedAdapter: DatabaseAdapter | undefined;

			const requirements = ACTION_REQUIREMENTS[chosenAction];
			if (!requirements) {
				console.error(
					chalk.red(
						`Internal error: No requirements defined for action '${chosenAction}'`,
					),
				);
				process.exit(1);
			}

			if (requirements.needsEnv) {
				// Determine environment
				chosenEnv = await determineEnvironment({ envInput: options.env });

				// Load environment variables using auto-detection
				loadEnvironment(chosenEnv);
			}

			// Load configuration (after environment is loaded)
			const config = await loadConfig({ configPath: options.config });

			if (requirements.needsAdapter) {
				const adapterResult = await determineAdapter({
					adapterInput: options.adapter,
					availableAdapters: config.adapters,
				});
				selectedAdapter = adapterResult.adapter;
			}

			// Execute the chosen action
			await executeAction({
				action: chosenAction,
				config,
				env: chosenEnv,
				adapter: selectedAdapter,
				showAll: options.all,
			});

			console.log(
				chalk.green.bold(
					`\\n✅ ${chosenAction.toUpperCase()} action completed successfully!`,
				),
			);
		} catch (error) {
			console.error(chalk.red(`\\n❌ Operation failed: ${error}`));
			process.exit(1);
		}
	});

program.addHelpText(
	"after",
	`

Examples:
  stripe-sync create --env test
  stripe-sync archive --env staging --config ./custom-stripe.config.ts
  stripe-sync sync --env dev --adapter main
  stripe-sync list-products --env test
  stripe-sync list-products --env test --all
  stripe-sync list-prices --env test
  stripe-sync list-prices --env test --all
  stripe-sync clear-db-plans --adapter prod-db --env test
  stripe-sync create --env prod --config /path/to/stripe.config.ts
  `,
);

// ========================================================================
// EXECUTION
// ========================================================================

// Only run CLI when this file is executed directly, not when imported
program
	.parseAsync(process.argv)
	.catch((error) => {
		console.error(chalk.red("An unexpected error occurred:"), error);
		process.exit(1);
	})
	.finally(() => {
		process.exit(0);
	});
