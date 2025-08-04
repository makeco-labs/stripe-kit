import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import dotenv from 'dotenv';

/**
 * Loads environment variables from .env file (required)
 */
export function loadEnvironment(envName: string): void {
  const envFile = `.env.${envName}`;
  const envPath = path.resolve(envFile);

  if (fs.existsSync(envPath)) {
    console.log(chalk.blue(`Loading environment from: ${envFile}`));
    dotenv.config({ path: envPath, override: true });
  } else {
    console.warn(
      chalk.yellow(`⚠️  Warning: Environment file not found: ${envFile}`)
    );
    console.log(chalk.gray(`Expected file: ${envPath}`));
  }
}
