import type Stripe from 'stripe';

import type { SubscriptionPlan } from '../config';
import type { Context, WithClient } from '../types';

// ------------------ FIND PRODUCT BY INTERNAL ID ------------------
async function findProductByInternalId(
  stripe: Stripe,
  internalProductId: string
): Promise<Stripe.Product | null> {
  const searchResult = await stripe.products.search({
    query: `metadata['internal_product_id']:'${internalProductId}' AND active:'true'`,
    limit: 1,
  });

  const product = searchResult.data.length > 0 ? searchResult.data[0] : null;
  return product ? product : null;
}

// ------------------ FIND PRICE BY INTERNAL ID ------------------
async function findPriceByInternalId(
  stripe: Stripe,
  internalPriceId: string,
  stripeProductId: string
): Promise<Stripe.Price | null> {
  const searchResult = await stripe.prices.search({
    query: `product:'${stripeProductId}' AND metadata['internal_price_id']:'${internalPriceId}' AND active:'true'`,
    limit: 1,
  });

  const price = searchResult.data.length > 0 && searchResult.data[0];
  return price ? price : null;
}

// ------------------ ENSURE STRIPE SUBSCRIPTION PLANS ------------------
export async function ensureStripeSubscriptionPlans(
  ctx: WithClient<Context>,
  input: { plans: SubscriptionPlan[] }
): Promise<void> {
  const { plans } = input;
  ctx.logger.info('Ensuring Stripe subscription plans exist...');

  if (!ctx.payment.stripeClient) {
    throw new Error('Stripe client not found');
  }

  const mappers = ctx.mappers;

  for (const plan of plans) {
    ctx.logger.info(
      `Processing plan: ${plan.name} (Internal ID: ${plan.id})...`
    );
    try {
      // 1. Ensure Product Exists
      let stripeProduct = await findProductByInternalId(
        ctx.payment.stripeClient,
        plan.id
      );
      if (stripeProduct) {
        ctx.logger.info(
          `  Product found: ${stripeProduct.name} (ID: ${stripeProduct.id})`
        );
      } else {
        ctx.logger.info('  Product not found in Stripe, creating...');
        const stripeProductParams =
          mappers.mapSubscriptionPlanToStripeProduct(plan);
        stripeProduct =
          await ctx.payment.stripeClient.products.create(stripeProductParams);
        ctx.logger.info(
          `  Created product: ${stripeProduct?.name} (ID: ${stripeProduct?.id})`
        );
      }

      // 2. Ensure Prices Exist
      for (const price of plan.prices) {
        let stripePrice = await findPriceByInternalId(
          ctx.payment.stripeClient,
          price.id,
          stripeProduct!.id
        );
        if (stripePrice) {
          ctx.logger.info(
            `    Price ${price.interval}ly found: ID ${stripePrice?.id}`
          );
        } else {
          ctx.logger.info(
            `    Price ${price.interval}ly (Internal ID: ${price.id}) not found, creating...`
          );
          const stripePriceParams = mappers.mapSubscriptionPlanToStripePrice(
            price,
            {
              planName: plan.name,
              tier: plan.id,
              internalProductId: plan.id,
              stripeProductId: stripeProduct!.id,
            }
          );
          stripePrice =
            await ctx.payment.stripeClient.prices.create(stripePriceParams);
          ctx.logger.info(
            `    Created price: ID ${stripePrice?.id} @ $${price.unitAmount / 100}`
          );
        }
      }
    } catch (error) {
      ctx.logger.error({
        message: 'Error ensuring subscription plan/prices in Stripe',
        error,
        metadata: { planId: plan.id, planName: plan.name },
      });
      throw error;
    }
  }
  ctx.logger.info('Finished ensuring Stripe subscription plans.');
}
