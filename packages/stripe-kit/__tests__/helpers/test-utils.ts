/**
 * Gets required environment variable with fallback for tests
 */
export function getTestEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required test environment variable: ${key}`);
  }
  return value;
}

/**
 * Gets Stripe secret key for tests with fallback
 */
export function getTestStripeKey(): string {
  return getTestEnv('STRIPE_SECRET_KEY');
}
