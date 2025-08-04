import chalk from 'chalk';
import prompts from 'prompts';
import type { ActionKey, DialectKey, EnvironmentKey } from './definitions';
import {
  ACTION_DESCRIPTIONS,
  VALID_ACTIONS,
  VALID_DIALECTS,
  VALID_ENVIRONMENTS,
} from './definitions';
import { onCancel } from './signals';

// ========================================================================
// ENVIRONMENT PROMPTS
// ========================================================================

/**
 * Determines the environment to be used, either from input or via interactive prompt
 */
export async function determineEnvironment(
  envInput?: EnvironmentKey
): Promise<EnvironmentKey> {
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
          { title: 'Test Environment', value: 'test' },
          { title: 'Development Server', value: 'dev' },
          { title: 'Staging Environment', value: 'staging' },
          { title: 'Production Environment', value: 'prod' },
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
export async function determineAction(
  actionInput?: string
): Promise<ActionKey> {
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
// DIALECT PROMPTS
// ========================================================================

/**
 * Determines the database dialect, either from input or via interactive prompt
 */
export async function determineDialect(
  dialectInput?: DialectKey
): Promise<DialectKey> {
  if (dialectInput && VALID_DIALECTS.includes(dialectInput)) {
    console.log(
      chalk.green(`Dialect specified via flag: ${chalk.bold(dialectInput)}`)
    );
    return dialectInput;
  }

  try {
    const response = await prompts(
      {
        type: 'select',
        name: 'value',
        message: chalk.blue('Select the target database dialect:'),
        choices: VALID_DIALECTS.map((dialect) => ({
          title: dialect.charAt(0).toUpperCase() + dialect.slice(1),
          value: dialect,
        })),
        initial: 0, // Default to sqlite
      },
      { onCancel }
    );

    if (!response.value) {
      console.log(chalk.red('\\nOperation canceled.'));
      process.exit(0);
    }

    console.log(
      chalk.green(`Dialect selected via prompt: ${chalk.bold(response.value)}`)
    );
    return response.value;
  } catch (error) {
    console.error(chalk.red('Error during dialect prompt:'), error);
    process.exit(1);
  }
}

// ========================================================================
// CONFIRMATION PROMPTS
// ========================================================================

/**
 * Confirms dangerous operations in production environment
 */
export async function confirmProductionOperation(
  action: string,
  env: EnvironmentKey
): Promise<boolean> {
  if (env !== 'prod') {
    return true;
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
      return false;
    }

    return true;
  } catch (error) {
    console.error(chalk.red('Error during confirmation prompt:'), error);
    return false;
  }
}
