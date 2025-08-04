import type { SubscriptionPlan } from '@billing/contracts/subscription-plan';
import {
  mapSubscriptionPlanToStripePrice,
  mapSubscriptionPlanToStripeProduct,
} from '@billing/infra/external/stripe/mappers';
import type { CoreContext, WithClient } from '@platform/context';
import { assertStripeClient } from '@platform/context';

// ------------------ PUBLIC FUNCTIONS ------------------

/**
 * Create subscription plans with associated prices
 * 1. Creates products in Stripe for each plan
 * 2. Creates prices for each product in Stripe
 * 3. Saves products and prices to the database
 */
export async function createStripeSubscriptionPlans(
  ctx: WithClient<CoreContext, 'payment'>,
  input: {
    plans: SubscriptionPlan[];
  }
): Promise<void> {
  // ------------------ ASSERTIONS ------------------
  assertStripeClient(ctx.payment);

  const { plans } = input;
  ctx.logger.info('Creating subscription plans...');

  // Process each plan
  for (const plan of plans) {
    try {
      // Create the product
      const stripeProductParams = mapSubscriptionPlanToStripeProduct(plan);
      const stripeProduct =
        await ctx.payment.stripeClient.products.create(stripeProductParams);

      ctx.logger.info(`Created product: ${stripeProduct.name}`);

      // Create the prices
      for (const price of plan.prices) {
        const stripePriceParams = mapSubscriptionPlanToStripePrice(price, {
          planName: plan.name,
          tier: plan.id,
          internalProductId: plan.id,
          stripeProductId: stripeProduct.id,
        });
        const stripePrice =
          await ctx.payment.stripeClient.prices.create(stripePriceParams);
        ctx.logger.info(
          `Created price: ${plan.name} ${price.interval}ly @ $${price.unitAmount / 100}`
        );
      }
    } catch (error) {
      ctx.logger.error({
        message: 'Error creating subscription plan',
        error,
        metadata: {
          name: plan.name,
          tier: plan.id,
          planId: plan.id,
        },
      });
    }
  }
}
