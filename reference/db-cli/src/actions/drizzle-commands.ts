import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// Use npx for universal compatibility

/**
 * Validates that drizzle-kit is available in the project
 */
export function validateDrizzleKit(): void {
  try {
    execSync('npx drizzle-kit --version', { stdio: 'pipe' });
  } catch {
    console.error(
      '❌ Error: drizzle-kit not found. Please install drizzle-kit as a dependency.'
    );
    process.exit(1);
  }
}

/**
 * Loads environment variables from .env file
 */
function loadEnvFile(envName: string): void {
  const envFile = `.env.${envName}`;
  const envPath = path.resolve(envFile);

  if (fs.existsSync(envPath)) {
    console.log(`Loading environment from: ${envFile}`);
    dotenv.config({ path: envPath, override: true });
  } else {
    console.warn(`⚠️  Warning: Environment file not found: ${envFile}`);
  }
}

/**
 * Executes a drizzle-kit command using Node.js dotenv instead of dotenv-cli
 */
export function executeCommand(
  command: string,
  configPath: string,
  envName: string
): void {
  // Load environment variables using Node.js dotenv
  loadEnvFile(envName);

  const fullCommand = `npx drizzle-kit ${command} --config="${configPath}"`;

  console.log(`Executing: ${fullCommand}`);

  try {
    execSync(fullCommand, {
      stdio: 'inherit',
      env: process.env, // Pass the current environment (including loaded .env vars)
    });
    console.log(`✅ Command completed successfully: ${command}`);
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    throw error; // Re-throw to be caught by the caller
  }
}
