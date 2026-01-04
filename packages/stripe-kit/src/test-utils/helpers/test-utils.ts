import type { DatabaseAdapter } from "@/definitions";

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
  return getTestEnv("STRIPE_SECRET_KEY");
}

/**
 * Creates a no-op mock adapter for tests that don't need real DB access
 * Used for Stripe-only commands like create, list, archive
 */
export function createMockAdapter(): DatabaseAdapter {
  return {
    async syncProducts() {},
    async syncPrices() {},
    async clearProducts() {},
    async clearPrices() {},
    async getProducts() {
      return [];
    },
    async getPrices() {
      return [];
    },
  };
}
