import type { Config, PricingPlan } from "@/definitions";

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
export const SIMPLE_TEST_PLANS: PricingPlan[] = [
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

/**
 * Tiered pricing plans for credit-based or volume-based purchases.
 *
 * IMPORTANT: Tiered pricing is calculated per checkout session, not cumulative.
 * Each purchase is independent - buying 1 credit twice = $50 + $50, not $70.
 *
 * Uses `billing_scheme: "tiered"` with `tiers_mode`:
 * - "graduated": Each tier charged at its own rate (most common)
 * - "volume": All units charged at the rate of the tier they fall into
 */
export const TIERED_PRICING_PLANS: PricingPlan[] = [
  {
    id: "tax-filing-credits",
    product: {
      name: "Tax Filing Credits",
      description: "Credits for filing tax returns",
      active: true,
      type: "service",
      unit_label: "credit",
      metadata: {
        product_type: "credits",
      },
    },
    prices: [
      // Price 1: Tiered credits (1-16)
      // - 1 credit = $50
      // - 2 credits = $70 ($50 + $20)
      // - 3 credits = $90 ($50 + $20 + $20)
      // - 16 credits = $350 ($50 + 15×$20)
      {
        id: "tax-credits-tiered",
        currency: "usd",
        billing_scheme: "tiered",
        tiers_mode: "graduated",
        tiers: [
          {
            up_to: 1,
            unit_amount: 5000, // First credit: $50
          },
          {
            up_to: 16,
            unit_amount: 2000, // Credits 2-16: $20 each
          },
        ],
        nickname: "Tax Filing Credits (Per Credit)",
        active: true,
        metadata: {
          pricing_model: "graduated_tiered",
          max_credits: "16",
        },
      },
      // Price 2: Unlimited credits - separate flat price
      // This is NOT a tier, but an alternative purchase option
      {
        id: "tax-credits-unlimited",
        currency: "usd",
        billing_scheme: "per_unit",
        unit_amount: 30000, // $300 flat for unlimited
        nickname: "Tax Filing Credits (Unlimited)",
        active: true,
        metadata: {
          pricing_model: "flat_unlimited",
          unlimited: "true",
        },
      },
    ],
  },
  {
    id: "api-requests",
    product: {
      name: "API Request Pack",
      description: "Pay-as-you-go API requests with volume discounts",
      active: true,
      type: "service",
      unit_label: "request",
    },
    prices: [
      {
        id: "api-requests-volume",
        currency: "usd",
        billing_scheme: "tiered",
        tiers_mode: "volume", // All units priced at the tier they fall into
        tiers: [
          {
            up_to: 1000,
            unit_amount: 10, // $0.10 per request (first 1K)
          },
          {
            up_to: 10000,
            unit_amount: 5, // $0.05 per request (1K-10K)
          },
          {
            up_to: "inf",
            unit_amount: 1, // $0.01 per request (10K+)
          },
        ],
        nickname: "API Requests (Volume)",
        active: true,
      },
    ],
  },
];

/**
 * One-time payment plans for testing non-subscription purchases.
 * These demonstrate prices without the `recurring` field.
 */
export const ONE_TIME_PAYMENT_PLANS: PricingPlan[] = [
  {
    id: "lifetime-access",
    product: {
      name: "Lifetime Access",
      description: "One-time purchase for permanent access to all features",
      active: true,
      type: "service",
      marketing_features: [
        { name: "Unlimited projects" },
        { name: "Priority support" },
        { name: "All future updates" },
      ],
      metadata: {
        plan_category: "one-time",
        target_audience: "power-user",
      },
    },
    prices: [
      {
        id: "lifetime-price",
        currency: "usd",
        billing_scheme: "per_unit",
        unit_amount: 29900, // $299.00
        nickname: "Lifetime Access",
        active: true,
        tax_behavior: "exclusive",
        metadata: {
          payment_type: "one_time",
        },
      },
    ],
  },
  {
    id: "setup-fee",
    product: {
      name: "Setup Fee",
      description: "One-time onboarding and configuration service",
      active: true,
      type: "service",
    },
    prices: [
      {
        id: "setup-fee-standard",
        currency: "usd",
        billing_scheme: "per_unit",
        unit_amount: 4900, // $49.00
        nickname: "Standard Setup",
        active: true,
      },
      {
        id: "setup-fee-premium",
        currency: "usd",
        billing_scheme: "per_unit",
        unit_amount: 14900, // $149.00
        nickname: "Premium Setup with Training",
        active: true,
        metadata: {
          includes_training: "true",
        },
      },
    ],
  },
];
