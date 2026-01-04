import type Stripe from "stripe";
import { z } from "zod";

import type { DatabaseAdapter } from "./database-adapter.schemas";
import { databaseAdapterSchema } from "./database-adapter.schemas";

import type { Prettify } from "./utility.types";

// ========================================================================
// PRICING PLAN TYPE
// ========================================================================

/**
 * A pricing plan combines a Stripe product with its prices.
 *
 * Supports both one-time and recurring prices. Uses Stripe's native types
 * directly - write your config using Stripe's exact API format (snake_case).
 * The `id` fields are internal identifiers used to track which config items
 * map to which Stripe resources.
 *
 * For one-time prices: omit the `recurring` field
 * For recurring prices: include `recurring` with `interval`, etc.
 */
export interface PricingPlan {
  /**
   * Internal product ID - stored in Stripe metadata for tracking.
   * This is NOT the Stripe product ID (which is assigned by Stripe).
   */
  id: string;

  /**
   * Product configuration using Stripe's native ProductCreateParams.
   * @see https://docs.stripe.com/api/products/create
   */
  product: Stripe.ProductCreateParams;

  /**
   * Price configurations using Stripe's native PriceCreateParams.
   * The `product` field is added automatically at creation time.
   *
   * Each price needs an `id` field for internal tracking.
   * @see https://docs.stripe.com/api/prices/create
   */
  prices: Array<
    {
      /** Internal price ID - stored in Stripe metadata for tracking */
      id: string;
    } & Omit<Stripe.PriceCreateParams, "product">
  >;
}

// ========================================================================
// MAIN CONFIGURATION SCHEMA
// ========================================================================

export const configSchema = z.object({
  // Plans use Stripe's native types - validated at runtime by Stripe SDK
  plans: z.array(z.any()),
  env: z.object({
    stripeSecretKey: z.string(),
  }),
  adapters: z.record(z.string(), databaseAdapterSchema),
  productIds: z.record(z.string(), z.string()).optional(),
  metadata: z
    .object({
      productIdField: z.string().default("internal_product_id"),
      priceIdField: z.string().default("internal_price_id"),
      managedByField: z.string().default("managed_by"),
      managedByValue: z.string().default("@makeco/stripe-kit"),
    })
    .default({
      productIdField: "internal_product_id",
      priceIdField: "internal_price_id",
      managedByField: "managed_by",
      managedByValue: "@makeco/stripe-kit",
    }),
});

export type Config = Prettify<
  Omit<z.infer<typeof configSchema>, "adapters" | "plans"> & {
    adapters: Record<string, DatabaseAdapter>;
    plans: PricingPlan[];
  }
>;

export type ConfigInput = Prettify<
  Omit<z.input<typeof configSchema>, "adapters" | "plans"> & {
    adapters: Record<string, DatabaseAdapter>;
    plans: PricingPlan[];
  }
>;
