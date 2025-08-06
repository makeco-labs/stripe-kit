import type Stripe from 'stripe';

import type { Context, SubscriptionPlan } from '@/definitions';
import { listStripePrices, listStripeProducts } from '@/utils';

// ========================================================================
// PRIVATE FUNCTIONS
// ========================================================================

// ------------------ UPDATE STRIPE PRODUCT ------------------
/**
 * Updates a Stripe product with new metadata and details
 */
async function updateStripeProduct(
  ctx: Context,
  plan: SubscriptionPlan,
  allStripeProducts: Stripe.Product[]
): Promise<void> {
  try {
    // Generate Stripe product parameters from the plan
    const stripeProductParams =
      ctx.mappers.mapSubscriptionPlanToStripeProduct(plan);

    // Find the product that matches our internal ID
    const stripeProduct = allStripeProducts.find(
      (product) =>
        product.metadata?.[ctx.config.metadata.productIdField] ===
          plan.product.id &&
        product.metadata?.[ctx.config.metadata.managedByField] ===
          ctx.config.metadata.managedByValue
    );

    if (!stripeProduct) {
      ctx.logger.warn(
        `Stripe product not found for ${plan.product.id}. Skipping update.`
      );
      return;
    }

    // Only metadata, name, description and active status can be updated
    await ctx.stripeClient.products.update(stripeProduct.id, {
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
      productId: plan.product.id,
    });
    throw new Error(`Failed to update Stripe product: ${error}`);
  }
}

// ------------------ UPDATE STRIPE PRICES ------------------
/**
 * Updates all prices for a subscription plan
 */
async function updateStripePrices(
  ctx: Context,
  plan: SubscriptionPlan,
  allStripePrices: Stripe.Price[]
): Promise<void> {
  try {
    // For each price in the plan
    for (const planPrice of plan.prices) {
      // Find matching Stripe price by internal ID
      const stripePrice = allStripePrices.find(
        (price) =>
          price.metadata?.[ctx.config.metadata.priceIdField] === planPrice.id &&
          price.metadata?.[ctx.config.metadata.managedByField] ===
            ctx.config.metadata.managedByValue
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
      const stripePriceParams = ctx.mappers.mapSubscriptionPlanToStripePrice(
        planPrice,
        {
          planName: plan.product.name,
          tier: plan.product.id,
          internalProductId: plan.product.id,
          stripeProductId,
        }
      );

      // Only metadata and active status can be updated for prices
      await ctx.stripeClient.prices.update(stripePrice.id, {
        active: stripePriceParams.active,
        metadata: stripePriceParams.metadata,
      });

      ctx.logger.info(`Updated Stripe price: ${stripePrice.id}`);
    }
  } catch (error) {
    ctx.logger.error({
      message: 'Error updating Stripe prices',
      error,
      planId: plan.product.id,
    });
    throw new Error(`Failed to update Stripe prices: ${error}`);
  }
}

// ========================================================================
// PUBLIC FUNCTIONS
// ========================================================================

/**
 * Updates existing subscription plans in Stripe based on the config plans.
 * Since Stripe doesn't allow updating most fields for prices (like amounts),
 * this function only updates metadata and active status.
 */
export async function updateStripeSubscriptionPlansAction(
  ctx: Context
): Promise<void> {
  const plans = ctx.config.plans;

  ctx.logger.info(`Updating ${plans.length} subscription plans in Stripe...`);

  try {
    // Fetch all managed products and prices once to avoid multiple API calls
    const allStripeProducts = await listStripeProducts(ctx, { showAll: false });
    const allStripePrices = await listStripePrices(ctx, { showAll: false });

    ctx.logger.info(
      `Found ${allStripeProducts.length} managed products and ${allStripePrices.length} managed prices in Stripe`
    );

    // Update each plan
    for (const plan of plans) {
      ctx.logger.info(
        `Updating plan: ${plan.product.name} (Internal ID: ${plan.product.id})...`
      );

      // Update the product
      await updateStripeProduct(ctx, plan, allStripeProducts);

      // Update the prices
      await updateStripePrices(ctx, plan, allStripePrices);
    }

    ctx.logger.info('Finished updating subscription plans in Stripe');
  } catch (error) {
    ctx.logger.error('Error updating Stripe subscription plans:', error);
    throw error;
  }
}
