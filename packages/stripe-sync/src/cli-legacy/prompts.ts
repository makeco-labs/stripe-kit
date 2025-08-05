import chalk from 'chalk';
import prompts from 'prompts';

import {
  ACTION_DESCRIPTIONS,
  ENVIRONMENTS,
  VALID_ACTIONS,
  VALID_ENVIRONMENTS,
} from './definitions';
import { onCancel } from './signals';

import type { DatabaseAdapter } from '../schemas';
import type { ActionKey, EnvironmentKey } from './definitions';

// ========================================================================
// ENVIRONMENT PROMPTS
// ========================================================================

/**
 * Determines the environment to be used, either from input or via interactive prompt
 */
export async function determineEnvironment(input: {
  envInput?: EnvironmentKey;
}): Promise<EnvironmentKey> {
  const { envInput } = input;

  if (envInput && VALID_ENVIRONMENTS.includes(envInput)) {
    console.log(
      chalk.green(`Environment specified via flag: ${chalk.bold(envInput)}`)
    );
    return envInput;
  }

  try {
    const response = await prompts(
      {
        type: 'select',
        name: 'value',
        message: chalk.blue('Select the target environment:'),
        choices: [
          { title: 'Test', value: 'test' },
          { title: 'Development', value: 'dev' },
          { title: 'Staging', value: 'staging' },
          { title: 'Production', value: 'prod' },
        ],
        initial: 0, // Default to 'test' for safety
      },
      { onCancel }
    );

    if (!response.value) {
      console.log(chalk.red('\\nOperation canceled.'));
      process.exit(0);
    }

    console.log(
      chalk.green(
        `Environment selected via prompt: ${chalk.bold(response.value)}`
      )
    );
    return response.value;
  } catch (error) {
    console.error(chalk.red('Error during environment prompt:'), error);
    process.exit(1);
  }
}

// ========================================================================
// ACTION PROMPTS
// ========================================================================

/**
 * Determines the action to be performed, either from input or via interactive prompt
 */
export async function determineAction(input: {
  actionInput?: string;
}): Promise<ActionKey> {
  const { actionInput } = input;

  if (actionInput && VALID_ACTIONS.includes(actionInput as ActionKey)) {
    const action = actionInput as ActionKey;
    console.log(
      chalk.green(`Action specified via argument: ${chalk.bold(action)}`)
    );
    return action;
  }

  if (actionInput) {
    console.log(
      chalk.yellow(`Invalid action specified: "${actionInput}". Prompting...`)
    );
  }

  try {
    const response = await prompts(
      {
        type: 'select',
        name: 'value',
        message: chalk.blue('Select the action to perform:'),
        choices: VALID_ACTIONS.map((action) => ({
          title: ACTION_DESCRIPTIONS[action],
          value: action,
        })),
        initial: 0,
      },
      { onCancel }
    );

    if (!response.value) {
      console.log(chalk.red('\\nOperation canceled.'));
      process.exit(0);
    }

    console.log(
      chalk.green(`Action selected via prompt: ${chalk.bold(response.value)}`)
    );
    return response.value;
  } catch (error) {
    console.error(chalk.red('Error during action prompt:'), error);
    process.exit(1);
  }
}

// ========================================================================
// ADAPTER PROMPTS
// ========================================================================

/**
 * Determines the database adapter, either from input or via interactive prompt.
 * Implements smart selection logic:
 * - 1 adapter: Auto-select silently
 * - Multiple adapters + flag: Use specified adapter
 * - Multiple adapters + no flag: Interactive prompt
 */
export async function determineAdapter(input: {
  adapterInput: string | undefined;
  availableAdapters: Record<string, DatabaseAdapter>;
}): Promise<{ name: string; adapter: DatabaseAdapter }> {
  const { adapterInput, availableAdapters } = input;
  const adapterNames = Object.keys(availableAdapters);

  // Smart selection logic
  if (adapterNames.length === 0) {
    console.error(chalk.red('No adapters found in configuration'));
    process.exit(1);
  }

  if (adapterNames.length === 1) {
    // Auto-select the only adapter
    const adapterName = adapterNames[0];
    console.log(
      chalk.green(`Auto-selected adapter: ${chalk.bold(adapterName)}`)
    );
    return { name: adapterName, adapter: availableAdapters[adapterName] };
  }

  // Multiple adapters available
  if (adapterInput) {
    if (availableAdapters[adapterInput]) {
      console.log(
        chalk.green(`Adapter specified via flag: ${chalk.bold(adapterInput)}`)
      );
      return { name: adapterInput, adapter: availableAdapters[adapterInput] };
    }
    console.log(
      chalk.yellow(
        `Invalid adapter specified: "${adapterInput}". Available: ${adapterNames.join(', ')}`
      )
    );
  }

  // Interactive prompt for multiple adapters
  try {
    const response = await prompts(
      {
        type: 'select',
        name: 'value',
        message: chalk.blue('Select the database adapter:'),
        choices: adapterNames.map((name) => ({
          title: name.charAt(0).toUpperCase() + name.slice(1),
          value: name,
        })),
        initial: 0,
      },
      { onCancel }
    );

    if (!response.value) {
      console.log(chalk.red('\\nOperation canceled.'));
      process.exit(0);
    }

    console.log(
      chalk.green(`Adapter selected via prompt: ${chalk.bold(response.value)}`)
    );
    return { name: response.value, adapter: availableAdapters[response.value] };
  } catch (error) {
    console.error(chalk.red('Error during adapter prompt:'), error);
    process.exit(1);
  }
}

// ========================================================================
// CONFIRMATION PROMPTS
// ========================================================================

/**
 * Requires confirmation for dangerous operations in production environment
 * Exits the process if not confirmed, otherwise continues execution
 */
export async function requireProductionConfirmation(input: {
  action: string;
  env: EnvironmentKey;
}): Promise<void> {
  const { action, env } = input;

  if (env !== ENVIRONMENTS.PROD) {
    return;
  }

  console.log(
    chalk.red.bold(
      `\\n⚠️  WARNING: You are about to perform a ${action.toUpperCase()} operation on PRODUCTION Stripe!`
    )
  );
  console.log(
    chalk.yellow(
      'This operation may affect the production Stripe configuration.'
    )
  );

  try {
    const response = await prompts(
      {
        type: 'confirm',
        name: 'value',
        message: chalk.red(
          `Are you absolutely sure you want to ${action} in PRODUCTION Stripe?`
        ),
        initial: false,
      },
      { onCancel }
    );

    if (!response.value) {
      console.log(chalk.yellow('\\nOperation canceled for safety.'));
      process.exit(0);
    }
  } catch (error) {
    console.error(chalk.red('Error during confirmation prompt:'), error);
    process.exit(1);
  }
}
