import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import dotenv from 'dotenv';

import type { Config } from '../config';
import type { EnvironmentKey } from './definitions';

/**
 * Loads environment variables from the configured environment file
 */
export function loadEnvironment(input: {
  envName: EnvironmentKey;
  config: Config;
}): void {
  const { envName, config } = input;
  const envFileName = config.envFiles[envName];

  if (!envFileName) {
    console.warn(
      chalk.yellow(`No environment file configured for: ${envName}`)
    );
    return;
  }

  const projectRoot = process.cwd();
  const specificEnvPath = path.join(projectRoot, envFileName);
  const relativeEnvPath = path.relative(projectRoot, specificEnvPath);

  if (fs.existsSync(specificEnvPath)) {
    console.log(
      chalk.blue(`Loading environment from: ${chalk.bold(relativeEnvPath)}`)
    );
    dotenv.config({ path: specificEnvPath, override: true });
  } else {
    console.warn(
      chalk.yellow(
        `[DEBUG] Warning: Target environment file NOT FOUND at "${specificEnvPath}".`
      )
    );
  }
}
