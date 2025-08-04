import type { Context, WithClient } from '../types';
import { fetchStripePrices, fetchStripeProducts } from './stripe-fetch-utils';

async function archiveStripeProducts(
  ctx: WithClient<Context>,
  input: {
    internalProductIds: string[];
  }
): Promise<void> {
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

async function archiveStripePrices(
  ctx: WithClient<Context>,
  input: {
    internalProductIds: string[];
  }
): Promise<void> {
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

export async function archiveStripeSubscriptionPlans(
  ctx: WithClient<Context>,
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

  await archiveStripeProducts(ctx, { internalProductIds });
  await archiveStripePrices(ctx, { internalProductIds });

  ctx.logger.info(
    `Successfully archived ${internalProductIds.length} subscription plans in Stripe`
  );
}
