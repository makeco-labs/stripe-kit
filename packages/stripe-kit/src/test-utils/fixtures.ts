import type { Config, SubscriptionPlan } from "@/definitions";

import { createSQLiteAdapter, getTestStripeKey } from "./helpers";

import type { createTestDatabase } from "./helpers";

/**
 * Creates a test configuration for real Stripe integration testing
 * Uses SQLite database with real Stripe API calls
 */
export function createTestConfig(
  db: ReturnType<typeof createTestDatabase>["db"],
): Config {
  return {
    plans: [
      {
        id: "free",
        product: {
          name: "Free Plan",
          description: "Perfect for getting started",
          active: true,
          type: "service",
          marketing_features: [
            { name: "5 projects" },
            { name: "Basic support" },
            { name: "1GB storage" },
            { name: "Community access" },
          ],
          metadata: {
            plan_category: "freemium",
            target_audience: "individual",
            trial_eligible: "false",
            popular_plan: "false",
          },
        },
        prices: [
          {
            id: "free-monthly",
            currency: "usd",
            billing_scheme: "per_unit",
            unit_amount: 0, // Free tier
            recurring: {
              interval: "month",
              interval_count: 1,
              usage_type: "licensed",
            },
            nickname: "Free Monthly",
            active: true,
            metadata: {
              billing_cycle: "monthly",
              is_free_tier: "true",
              discount_percent: "0",
            },
          },
        ],
      },
      {
        id: "pro",
        product: {
          name: "Pro Plan",
          description: "For growing businesses",
          active: true,
          type: "service",
          marketing_features: [
            { name: "Unlimited projects" },
            { name: "Priority support" },
            { name: "50GB storage" },
            { name: "Advanced analytics" },
            { name: "API access" },
            { name: "Custom integrations" },
          ],
          metadata: {
            plan_category: "paid",
            target_audience: "small-business",
            trial_eligible: "true",
            popular_plan: "true",
          },
        },
        prices: [
          {
            id: "pro-monthly",
            currency: "usd",
            billing_scheme: "per_unit",
            unit_amount: 2999, // $29.99
            recurring: {
              interval: "month",
              interval_count: 1,
              usage_type: "licensed",
            },
            nickname: "Pro Monthly",
            active: true,
            tax_behavior: "exclusive",
            metadata: {
              billing_cycle: "monthly",
              is_promotional: "false",
              discount_percent: "0",
            },
          },
          {
            id: "pro-yearly",
            currency: "usd",
            billing_scheme: "per_unit",
            unit_amount: 29_999, // $299.99 (save ~17%)
            recurring: {
              interval: "year",
              interval_count: 1,
              usage_type: "licensed",
            },
            nickname: "Pro Annual",
            active: true,
            tax_behavior: "exclusive",
            metadata: {
              billing_cycle: "yearly",
              is_promotional: "true",
              discount_percent: "17",
            },
          },
        ],
      },
    ],

    // Real test environment variables
    env: {
      stripeSecretKey: getTestStripeKey(),
    },

    // SQLite adapter for testing
    adapters: {
      sqlite: createSQLiteAdapter(db),
    },

    // Test metadata configuration
    metadata: {
      productIdField: "internal_product_id",
      priceIdField: "internal_price_id",
      managedByField: "managed_by",
      managedByValue: "@makeco/stripe-kit-integration-test",
    },
  };
}

/**
 * Simple test plans for quick testing scenarios
 */
export const SIMPLE_TEST_PLANS: SubscriptionPlan[] = [
  {
    id: "test-basic",
    product: {
      name: "Test Basic Plan",
      description: "Simple integration test plan",
      active: true,
      type: "service",
    },
    prices: [
      {
        id: "test-basic-monthly",
        currency: "usd",
        billing_scheme: "per_unit",
        unit_amount: 999, // $9.99
        recurring: {
          interval: "month",
          interval_count: 1,
          usage_type: "licensed",
        },
        nickname: "Test Basic Monthly",
        active: true,
      },
    ],
  },
];
