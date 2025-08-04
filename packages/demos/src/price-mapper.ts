import type { SubscriptionPrice, StripePriceContext } from '@makeco/stripe-sync';
import type Stripe from 'stripe';

/**
 * Custom mapper for subscription prices to Stripe prices
 * Adds detailed pricing metadata and business logic
 */
export function mapSubscriptionPlanToStripePrice(
  price: SubscriptionPrice,
  context: StripePriceContext
): Stripe.PriceCreateParams {
  const isYearly = price.interval === 'year';
  const isFree = price.unitAmount === 0;

  return {
    product: context.stripeProductId,
    unit_amount: price.unitAmount,
    currency: price.currency,
    recurring: {
      interval: price.interval,
      usage_type: 'licensed', // or 'metered' for usage-based
    },
    metadata: {
      internal_price_id: price.id,
      internal_product_id: context.internalProductId,
      plan_name: context.planName,
      tier: context.tier,
      // Pricing metadata
      billing_cycle: price.interval,
      is_promotional: isYearly ? 'true' : 'false',
      discount_percent: isYearly ? '17' : '0',
      is_free_tier: isFree ? 'true' : 'false',
      // Business metrics
      mrr_contribution: isYearly
        ? (price.unitAmount / 12).toString()
        : price.unitAmount.toString(),
      // Marketing flags
      discount_eligible: 'true',
      price_type: 'recurring',
      created_by: '@makeco/stripe-sync',
    },
    // Stripe price configuration
    nickname: `${context.planName} ${isYearly ? 'Annual' : 'Monthly'}`,
    tax_behavior: 'exclusive', // Tax added on top
    billing_scheme: 'per_unit',
    // Could add tiered pricing here:
    // tiers: [{ up_to: 100, unit_amount: 1000 }, ...],
    // tiers_mode: 'volume',
  };
}