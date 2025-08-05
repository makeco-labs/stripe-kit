import type Stripe from 'stripe';
import { z } from 'zod';

// ========================================================================
// NESTED STRIPE PRODUCT SCHEMAS
// ========================================================================

// ------------------ Marketing Feature ------------------
export const marketingFeatureSchema = z.object({
  name: z.string().max(80),
});

export type MarketingFeature = z.infer<typeof marketingFeatureSchema>;

// ------------------ Package Dimensions ------------------
export const packageDimensionsSchema = z.object({
  height: z.number(),
  length: z.number(),
  weight: z.number(),
  width: z.number(),
});

export type PackageDimensions = z.infer<typeof packageDimensionsSchema>;

// ------------------ Default Price Data ------------------
export const defaultPriceDataSchema = z.object({
  currency: z.string().length(3),
  unitAmount: z.number().optional(),
  unitAmountDecimal: z.string().optional(),
  recurring: z
    .object({
      interval: z.enum(['day', 'month', 'week', 'year']),
      intervalCount: z.number().optional(),
    })
    .optional(),
  taxBehavior: z.enum(['exclusive', 'inclusive', 'unspecified']).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type DefaultPriceData = z.infer<typeof defaultPriceDataSchema>;

// ========================================================================
// MAIN STRIPE PRODUCT SCHEMA
// ========================================================================

export const stripeProductSchema = z.object({
  // Required fields
  id: z.string(),
  name: z.string(),

  // Optional core fields
  active: z.boolean().default(true),
  description: z.string().optional(),

  // Pricing configuration
  defaultPriceData: defaultPriceDataSchema.optional(),

  // Visual and marketing
  images: z.array(z.string()).max(8).optional(),
  marketingFeatures: z.array(marketingFeatureSchema).max(15).optional(),
  url: z.string().url().optional(),

  // Business configuration
  type: z.enum(['good', 'service']).default('service'),
  shippable: z.boolean().optional(),
  packageDimensions: packageDimensionsSchema.optional(),

  // Financial
  statementDescriptor: z.string().max(22).optional(),
  taxCode: z.string().optional(),
  unitLabel: z.string().optional(),

  // Feature configuration (our custom approach)
  features: z.record(z.string(), z.any()).optional(),

  // Extensibility
  metadata: z.record(z.string(), z.string()).optional(),
});

export type StripeProduct = z.infer<typeof stripeProductSchema>;

// ========================================================================
// MAPPER TYPES
// ========================================================================

export interface StripeProductMapperContext {
  internalProductId: string;
}

export type StripeProductMapper = (
  product: StripeProduct,
  context: StripeProductMapperContext
) => Stripe.ProductCreateParams;
