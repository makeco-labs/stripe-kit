import type { SubscriptionPlan } from '@billing/contracts/subscription-plan';
import { billingConfig } from '@billing/domain';
import {
  mapSubscriptionPlanToStripePrice,
  mapSubscriptionPlanToStripeProduct,
} from '@billing/infra/external/stripe/mappers';
import { ServerError } from '@lib/utils/errors';
import type { CoreContext, WithClient } from '@platform/context';
import { assertStripeClient } from '@platform/context';
import type Stripe from 'stripe';
import { fetchStripePrices, fetchStripeProducts } from './stripe-fetch-utils';

// ------------------ TYPES ------------------

export interface UpdateStripeSubscriptionPlansInput {
  plans: SubscriptionPlan[];
}

// ------------------ PRIVATE FUNCTIONS ------------------

/**
 * Updates a Stripe product with new metadata and details
 */
async function updateStripeProduct(
  ctx: WithClient<Pick<CoreContext, 'logger'>, 'payment'>,
  plan: SubscriptionPlan,
  allStripeProducts: Stripe.Product[]
): Promise<void> {
  // ------------------ ASSERTIONS ------------------
  assertStripeClient(ctx.payment);

  try {
    // Generate Stripe product parameters from the plan
    const stripeProductParams = mapSubscriptionPlanToStripeProduct(plan);

    // Find the product that matches our internal ID
    const stripeProduct = allStripeProducts.find(
      (product) =>
        product.metadata?.internal_product_id === plan.id &&
        product.metadata?.application_id === billingConfig.applicationId
    );

    if (!stripeProduct) {
      ctx.logger.warn(
        `Stripe product not found for ${plan.id}. Skipping update.`
      );
      return;
    }

    // Only metadata, name, description and active status can be updated
    await ctx.payment.stripeClient.products.update(stripeProduct.id, {
      name: stripeProductParams.name,
      description: stripeProductParams.description,
      active: stripeProductParams.active,
      metadata: stripeProductParams.metadata,
    });

    ctx.logger.info(`Updated Stripe product: ${stripeProduct.id}`);
  } catch (error) {
    ctx.logger.error({
      message: 'Error updating Stripe product',
      error,
      productId: plan.id,
    });
    throw new ServerError({
      message: 'Failed to update Stripe product',
      internalCode: 'STRIPE_PRODUCT_UPDATE_FAILED',
    });
  }
}

/**
 * Updates all prices for a subscription plan
 */
async function updateStripePrices(
  ctx: WithClient<Pick<CoreContext, 'logger'>, 'payment'>,
  plan: SubscriptionPlan,
  allStripePrices: Stripe.Price[]
): Promise<void> {
  // ------------------ ASSERTIONS ------------------
  assertStripeClient(ctx.payment);

  try {
    // For each price in the plan
    for (const planPrice of plan.prices) {
      // Find matching Stripe price by internal ID
      const stripePrice = allStripePrices.find(
        (price) =>
          price.metadata?.internal_price_id === planPrice.id &&
          price.metadata?.application_id === billingConfig.applicationId
      );

      if (!stripePrice) {
        ctx.logger.warn(
          `Stripe price not found for ${planPrice.id}. Skipping update.`
        );
        continue;
      }

      const stripeProductId =
        typeof stripePrice.product === 'string'
          ? stripePrice.product
          : stripePrice.product.id;

      // Generate price parameters
      const stripePriceParams = mapSubscriptionPlanToStripePrice(planPrice, {
        planName: plan.name,
        tier: plan.tier,
        internalProductId: plan.id,
        stripeProductId,
      });

      // Only metadata and active status can be updated for prices
      await ctx.payment.stripeClient.prices.update(stripePrice.id, {
        active: stripePriceParams.active,
        metadata: stripePriceParams.metadata,
      });

      ctx.logger.info(`Updated Stripe price: ${stripePrice.id}`);
    }
  } catch (error) {
    ctx.logger.error({
      message: 'Error updating Stripe prices',
      error,
      planId: plan.id,
    });
    throw new ServerError({
      message: 'Failed to update Stripe prices',
      internalCode: 'STRIPE_PRICE_UPDATE_FAILED',
    });
  }
}

// ------------------ PUBLIC FUNCTIONS ------------------

/**
 * Updates existing subscription plans in Stripe based on the provided plans.
 * Since Stripe doesn't allow updating most fields for prices (like amounts),
 * this function only updates metadata and active status.
 *
 * This function does not update the database.
 */
export async function updateStripeSubscriptionPlans(
  ctx: WithClient<Pick<CoreContext, 'logger'>, 'payment'>,
  input: UpdateStripeSubscriptionPlansInput
): Promise<void> {
  const { plans } = input;

  ctx.logger.info(`Updating ${plans.length} subscription plans in Stripe...`);

  // Fetch all products and prices once to avoid multiple API calls
  const allStripeProducts = await fetchStripeProducts(ctx);
  const allStripePrices = await fetchStripePrices(ctx);

  // Update each plan
  for (const plan of plans) {
    // Update the product
    await updateStripeProduct(ctx, plan, allStripeProducts);

    // Update the prices
    await updateStripePrices(ctx, plan, allStripePrices);
  }

  ctx.logger.info('Finished updating subscription plans in Stripe');
}
