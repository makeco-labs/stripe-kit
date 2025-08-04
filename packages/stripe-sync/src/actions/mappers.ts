import type Stripe from 'stripe';

import type {
  StripeMappers,
  StripePriceContext,
  SubscriptionPlan,
  SubscriptionPrice,
} from '@/config';

export function createDefaultMappers(): StripeMappers {
  return {
    mapSubscriptionPlanToStripeProduct: (
      plan: SubscriptionPlan
    ): Stripe.ProductCreateParams => {
      return {
        name: plan.name,
        description: plan.description,
        metadata: {
          internal_product_id: plan.id,
          features: JSON.stringify(plan.features || []),
        },
      };
    },

    mapSubscriptionPlanToStripePrice: (
      price: SubscriptionPrice,
      context: StripePriceContext
    ): Stripe.PriceCreateParams => {
      return {
        product: context.stripeProductId,
        unit_amount: price.unitAmount,
        currency: price.currency,
        recurring: {
          interval: price.interval,
        },
        metadata: {
          internal_price_id: price.id,
          internal_product_id: context.internalProductId,
          plan_name: context.planName,
          tier: context.tier,
        },
      };
    },
  };
}
