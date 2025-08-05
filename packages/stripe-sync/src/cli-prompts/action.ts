import chalk from 'chalk';
import prompts from 'prompts';

import {
  ACTION_DESCRIPTIONS,
  VALID_ACTIONS,
} from '../definitions';
import { onCancel } from '../utils/signals';

import type { ActionKey } from '../definitions';

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