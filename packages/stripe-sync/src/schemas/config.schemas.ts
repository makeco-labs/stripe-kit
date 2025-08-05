import { z } from 'zod';

import { databaseAdapterSchema } from './database-adapter.schemas';
import { stripePriceSchema } from './stripe-price.schemas';
import { stripeProductSchema } from './stripe-product.schemas';

import type { DatabaseAdapter } from './database-adapter.schemas';
import type { Prettify } from '@/types';

// ========================================================================
// SUBSCRIPTION PLAN SCHEMA (COMBINES PRODUCT + PRICES)
// ========================================================================

export const subscriptionPlanSchema = z.object({
  // Product configuration
  product: stripeProductSchema,
  
  // Associated prices
  prices: z.array(stripePriceSchema).min(1),
});

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

// ========================================================================
// STRIPE MAPPER TYPES
// ========================================================================

export interface StripePriceContext {
  stripeProductId: string;
  internalProductId: string;
  planName: string;
  tier: string;
}

export interface StripeMappers {
  mapSubscriptionPlanToStripeProduct: (
    plan: SubscriptionPlan
  ) => import('stripe').Stripe.ProductCreateParams;
  mapSubscriptionPlanToStripePrice: (
    price: import('./stripe-price.schemas').StripePrice,
    context: StripePriceContext
  ) => import('stripe').Stripe.PriceCreateParams;
}

// ========================================================================
// MAIN CONFIGURATION SCHEMA
// ========================================================================

export const configSchema = z.object({
  plans: z.array(subscriptionPlanSchema),
  env: z.object({
    stripeSecretKey: z.string(),
  }),
  adapters: z.record(z.string(), databaseAdapterSchema),
  productIds: z.record(z.string(), z.string()).optional(),
  metadata: z
    .object({
      productIdField: z.string().default('internal_product_id'),
      priceIdField: z.string().default('internal_price_id'),
      managedByField: z.string().default('managed_by'),
      managedByValue: z.string().default('stripe-sync'),
    })
    .default({
      productIdField: 'internal_product_id',
      priceIdField: 'internal_price_id',
      managedByField: 'managed_by',
      managedByValue: 'stripe-sync',
    }),
});

export type Config = Prettify<
  Omit<z.infer<typeof configSchema>, 'adapters'> & {
    adapters: Record<string, DatabaseAdapter>;
  }
>;