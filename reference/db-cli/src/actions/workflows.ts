import type { Config } from 'drizzle-kit';
import { executeCommand } from './drizzle-commands';
import { executeReset } from './reset';

// Updated workflow definitions - drop vs reset distinction
const WORKFLOWS = {
  reset: ['reset'] as const, // Clear database data only (drop tables/schemas)
  refresh: ['drop', 'generate', 'reset', 'migrate'] as const, // Drop migrations, generate, clear data, migrate
} as const;

/**
 * Executes a workflow (sequence of commands)
 */
export async function executeWorkflow(
  workflow: readonly string[],
  configPath: string,
  config: Config,
  envName: string
): Promise<void> {
  console.log(`Executing workflow: ${workflow.join(' → ')}`);

  for (const step of workflow) {
    console.log(`\n📋 Step: ${step}`);

    if (step === 'reset') {
      await executeReset(config);
    } else {
      executeCommand(step, configPath, envName);
    }
  }

  console.log('\n✅ Workflow completed successfully!');
}

/**
 * Prompts for confirmation in production environment
 */
export async function requireProductionConfirmation(
  action: string,
  config: Config
): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    return;
  }

  console.log(
    `\n⚠️  WARNING: You are about to perform a ${action.toUpperCase()} operation in PRODUCTION!`
  );
  console.log(
    'This operation is destructive and will affect the production database.'
  );
  console.log(`Database: ${config.dialect}`);

  // For now, we'll exit in production for safety
  // In a real implementation, you might want to add an interactive prompt
  console.log('❌ Operation canceled for safety in production environment.');
  console.log(
    'Use NODE_ENV=development to bypass this check in non-production environments.'
  );
  process.exit(1);
}

export { WORKFLOWS };
