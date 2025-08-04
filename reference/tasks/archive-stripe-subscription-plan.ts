import type { CoreContext, WithClient } from '@platform/context';
import { assertStripeClient } from '@platform/context';
import { fetchStripePrices, fetchStripeProducts } from './stripe-fetch-utils';

// ------------------ PRIVATE FUNCTIONS ------------------

/**
 * Archives products in Stripe (sets active=false)
 */
async function archiveStripeProducts(
  ctx: WithClient<Pick<CoreContext, 'logger'>, 'payment'>,
  input: {
    internalProductIds: string[];
  }
): Promise<void> {
  // ------------------ ASSERTIONS ------------------
  assertStripeClient(ctx.payment);

  const { internalProductIds } = input;

  if (!internalProductIds.length) {
    ctx.logger.info('No product IDs provided for archiving');
    return;
  }

  const products = await fetchStripeProducts(ctx);
  const productsToArchive = products.filter((product) =>
    internalProductIds.includes(product.metadata?.internal_product_id ?? '')
  );

  if (productsToArchive.length === 0) {
    ctx.logger.info('No products to archive in Stripe');
    return;
  }

  for (const product of productsToArchive) {
    try {
      await ctx.payment.stripeClient.products.update(product.id, {
        active: false,
      });
      ctx.logger.info(`Archived product in Stripe: ${product.id}`);
    } catch (error) {
      ctx.logger.error({
        message: 'Error archiving product in Stripe',
        error,
        productId: product.id,
      });
    }
  }
}

/**
 * Archives prices in Stripe (sets active=false)
 */
async function archiveStripePrices(
  ctx: WithClient<Pick<CoreContext, 'logger'>, 'payment'>,
  input: {
    internalProductIds: string[];
  }
): Promise<void> {
  // ------------------ ASSERTIONS ------------------
  assertStripeClient(ctx.payment);

  const { internalProductIds } = input;

  if (!internalProductIds.length) {
    ctx.logger.info('No product IDs provided for archiving');
    return;
  }

  const prices = await fetchStripePrices(ctx);
  const pricesToArchive = prices.filter((price) =>
    internalProductIds.includes(price.metadata?.internal_product_id ?? '')
  );

  if (pricesToArchive.length === 0) {
    ctx.logger.info('No prices to archive in Stripe');
    return;
  }

  for (const price of pricesToArchive) {
    try {
      await ctx.payment.stripeClient.prices.update(price.id, {
        active: false,
      });
      ctx.logger.info(`Archived price in Stripe: ${price.id}`);
    } catch (error) {
      ctx.logger.error({
        message: 'Error archiving price in Stripe',
        error,
        priceId: price.id,
      });
    }
  }
}

// ------------------ PUBLIC FUNCTIONS ------------------

/**
 * Archives subscription plans in Stripe by setting them as inactive (active=false).
 * This function does not modify the database.
 *
 * Logic flow:
 * 1. Find products and prices in Stripe
 * 2. Archive products and prices in Stripe (set active=false)
 */
export async function archiveStripeSubscriptionPlans(
  ctx: WithClient<Pick<CoreContext, 'logger'>, 'payment'>,
  input: {
    internalProductIds: string[];
  }
): Promise<void> {
  const { internalProductIds } = input;

  if (internalProductIds.length === 0) {
    ctx.logger.info('No product IDs provided for archiving');
    return;
  }

  ctx.logger.info(
    `Archiving ${internalProductIds.length} subscription plans in Stripe...`
  );

  // Archive in Stripe
  await archiveStripeProducts(ctx, { internalProductIds });
  await archiveStripePrices(ctx, { internalProductIds });

  ctx.logger.info(
    `Successfully archived ${internalProductIds.length} subscription plans in Stripe`
  );
}
