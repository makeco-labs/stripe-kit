import type Stripe from 'stripe';
import { z } from 'zod';

// ========================================================================
// NESTED STRIPE PRICE SCHEMAS
// ========================================================================

// ------------------ Recurring Configuration ------------------
export const recurringSchema = z.object({
  interval: z.enum(['day', 'month', 'week', 'year']),
  intervalCount: z.number().min(1).default(1),
  trialPeriodDays: z.number().min(0).optional(),
  usageType: z.enum(['licensed', 'metered']).default('licensed'),
  meter: z.string().optional(),
});

export type Recurring = z.infer<typeof recurringSchema>;

// ------------------ Currency Options ------------------
export const currencyOptionsSchema = z.object({
  unitAmount: z.number().optional(),
  unitAmountDecimal: z.string().optional(),
  taxBehavior: z.enum(['exclusive', 'inclusive', 'unspecified']).optional(),
});

export type CurrencyOptions = z.infer<typeof currencyOptionsSchema>;

// ------------------ Custom Unit Amount ------------------
export const customUnitAmountSchema = z.object({
  enabled: z.boolean(),
  maximum: z.number().optional(),
  minimum: z.number().optional(),
  preset: z.number().optional(),
});

export type CustomUnitAmount = z.infer<typeof customUnitAmountSchema>;

// ------------------ Tier Configuration ------------------
export const tierSchema = z.object({
  flatAmount: z.number().optional(),
  flatAmountDecimal: z.string().optional(),
  unitAmount: z.number().optional(),
  unitAmountDecimal: z.string().optional(),
  upTo: z.union([z.literal('inf'), z.number()]),
});

export type Tier = z.infer<typeof tierSchema>;

// ------------------ Transform Quantity ------------------
export const transformQuantitySchema = z.object({
  divideBy: z.number(),
  round: z.enum(['down', 'up']),
});

export type TransformQuantity = z.infer<typeof transformQuantitySchema>;

// ========================================================================
// MAIN STRIPE PRICE SCHEMA
// ========================================================================

export const stripePriceSchema = z.object({
  // Required fields
  id: z.string(),
  currency: z.string().length(3),

  // Core pricing
  unitAmount: z.number().min(0).optional(),
  unitAmountDecimal: z.string().optional(),

  // Price type and billing
  type: z.enum(['one_time', 'recurring']).default('recurring'),
  billingScheme: z.enum(['per_unit', 'tiered']).default('per_unit'),

  // Recurring configuration
  recurring: recurringSchema.optional(),

  // Advanced pricing
  tiers: z.array(tierSchema).optional(),
  tiersMode: z.enum(['graduated', 'volume']).optional(),
  transformQuantity: transformQuantitySchema.optional(),

  // Currency and localization
  currencyOptions: z.record(z.string(), currencyOptionsSchema).optional(),
  customUnitAmount: customUnitAmountSchema.optional(),

  // Tax and compliance
  taxBehavior: z.enum(['exclusive', 'inclusive', 'unspecified']).optional(),

  // Display and organization
  nickname: z.string().optional(),
  lookupKey: z.string().max(200).optional(),
  active: z.boolean().default(true),

  // Extensibility
  metadata: z.record(z.string(), z.string()).optional(),
});

export type StripePrice = z.infer<typeof stripePriceSchema>;

// ========================================================================
// MAPPER TYPES
// ========================================================================

export interface StripePriceMapperContext {
  stripeProductId: string;
  internalProductId: string;
  internalPriceId: string;
  planName: string;
  tier: string;
}

export type StripePriceMapper = (
  price: StripePrice,
  context: StripePriceMapperContext
) => Stripe.PriceCreateParams;
