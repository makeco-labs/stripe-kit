import chalk from "chalk";
import prompts from "prompts";

import { VALID_ENVIRONMENTS } from "../definitions";

import type { EnvironmentKey } from "../definitions";

/**
 * Determines the environment to be used, either from input or via interactive prompt
 */
export async function determineEnvironment(input: {
	envInput?: EnvironmentKey;
}): Promise<EnvironmentKey> {
	const { envInput } = input;

	if (envInput && VALID_ENVIRONMENTS.includes(envInput)) {
		console.log(
			chalk.green(`Environment specified via flag: ${chalk.bold(envInput)}`),
		);
		return envInput;
	}

	try {
		const response = await prompts({
			type: "select",
			name: "value",
			message: chalk.blue("Select the target environment:"),
			choices: [
				{ title: "Test", value: "test" },
				{ title: "Development", value: "dev" },
				{ title: "Staging", value: "staging" },
				{ title: "Production", value: "prod" },
			],
			initial: 0, // Default to 'test' for safety
		});

		if (!response.value) {
			process.exit(0);
		}

		console.log(
			chalk.green(
				`Environment selected via prompt: ${chalk.bold(response.value)}`,
			),
		);
		return response.value;
	} catch (error) {
		console.error(chalk.red("Error during environment prompt:"), error);
		process.exit(1);
	}
}
