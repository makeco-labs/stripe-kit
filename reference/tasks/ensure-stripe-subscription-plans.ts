import type { SubscriptionPlan } from '@billing/contracts/subscription-plan';
import { BILLING_ERROR_CODE } from '@billing/domain/errors';
import {
  mapSubscriptionPlanToStripePrice,
  mapSubscriptionPlanToStripeProduct,
} from '@billing/infra/external/stripe/mappers';
import { ServerError } from '@lib/utils/errors';
import type { CoreContext, WithClient } from '@platform/context';
import { assertStripeClient } from '@platform/context';
import type { Stripe } from 'stripe';

// ------------------ PRIVATE FUNCTIONS ------------------

async function findProductByInternalId(
  stripe: Stripe,
  internalProductId: string
): Promise<Stripe.Product | null> {
  // Use search for more robust matching on metadata
  const searchResult = await stripe.products.search({
    query: `metadata['internal_product_id']:'${internalProductId}' AND active:'true'`,
    limit: 1,
  });

  const product = searchResult.data.length > 0 ? searchResult.data[0] : null;

  return product ? product : null;
}

async function findPriceByInternalId(
  stripe: Stripe,
  internalPriceId: string,
  stripeProductId: string
): Promise<Stripe.Price | null> {
  // Use search for metadata matching
  const searchResult = await stripe.prices.search({
    query: `product:'${stripeProductId}' AND metadata['internal_price_id']:'${internalPriceId}' AND active:'true'`,
    limit: 1,
  });

  const price = searchResult.data.length > 0 && searchResult.data[0];

  return price ? price : null;
}

// ------------------ PUBLIC FUNCTIONS ------------------

export async function ensureStripeSubscriptionPlans(
  ctx: WithClient<Pick<CoreContext, 'logger'>, 'payment'>,
  input: { plans: SubscriptionPlan[] }
): Promise<void> {
  // ------------------ ASSERTIONS ------------------
  assertStripeClient(ctx.payment);

  const { plans } = input;
  ctx.logger.info('Ensuring Stripe subscription plans exist...');

  if (!ctx.payment.stripeClient) {
    throw new ServerError({
      internalCode: BILLING_ERROR_CODE.STRIPE_CLIENT_NOT_FOUND,
      message: 'Stripe client not found',
    });
  }

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
        // Optional: Add logic here to UPDATE the product if needed based on plan definition
      } else {
        ctx.logger.info('  Product not found in Stripe, creating...');
        const stripeProductParams = mapSubscriptionPlanToStripeProduct(plan);
        stripeProduct =
          await ctx.payment.stripeClient.products.create(stripeProductParams);
        ctx.logger.info(
          `  Created product: ${stripeProduct.name} (ID: ${stripeProduct.id})`
        );
      }

      // 2. Ensure Prices Exist
      for (const price of plan.prices) {
        let stripePrice = await findPriceByInternalId(
          ctx.payment.stripeClient,
          price.id,
          stripeProduct.id
        );
        if (stripePrice) {
          ctx.logger.info(
            `    Price ${price.interval}ly found: ID ${stripePrice.id}`
          );
          // Optional: Add logic here to UPDATE the price if needed (note: many price fields are immutable, often requires creating a new price and archiving the old one)
        } else {
          ctx.logger.info(
            `    Price ${price.interval}ly (Internal ID: ${price.id}) not found, creating...`
          );
          const stripePriceParams = mapSubscriptionPlanToStripePrice(price, {
            planName: plan.name,
            tier: plan.id,
            internalProductId: plan.id,
            stripeProductId: stripeProduct.id,
            // Consider adding lookup_key: price.id here for easier retrieval later
          });
          stripePrice =
            await ctx.payment.stripeClient.prices.create(stripePriceParams);
          ctx.logger.info(
            `    Created price: ID ${stripePrice.id} @ $${price.unitAmount / 100}`
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
