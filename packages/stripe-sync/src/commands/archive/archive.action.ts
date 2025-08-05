import type { Context } from '@/types';
import { findStripeProduct, listStripePrices } from '@/utils';

// ------------------ ARCHIVE STRIPE PRODUCTS ------------------
async function archiveStripeProducts(
  ctx: Context,
  input: {
    internalProductIds: string[];
  }
): Promise<void> {
  const { internalProductIds } = input;

  if (!internalProductIds.length) {
    ctx.logger.info('No product IDs provided for archiving');
    return;
  }

  let archivedCount = 0;

  for (const internalProductId of internalProductIds) {
    try {
      const product = await findStripeProduct(ctx, { internalProductId });
      
      if (!product) {
        ctx.logger.info(`Product not found in Stripe: ${internalProductId}`);
        continue;
      }

      await ctx.stripeClient.products.update(product.id, {
        active: false,
      });
      ctx.logger.info(`Archived product in Stripe: ${product.id} (Internal ID: ${internalProductId})`);
      archivedCount++;
    } catch (error) {
      ctx.logger.error({
        message: 'Error archiving product in Stripe',
        error,
        internalProductId,
      });
    }
  }

  if (archivedCount === 0) {
    ctx.logger.info('No products were archived in Stripe');
  }
}

// ------------------ ARCHIVE STRIPE PRICES ------------------
async function archiveStripePrices(
  ctx: Context,
  input: {
    internalProductIds: string[];
  }
): Promise<void> {
  const { internalProductIds } = input;

  if (!internalProductIds.length) {
    ctx.logger.info('No product IDs provided for archiving');
    return;
  }

  const prices = await listStripePrices(ctx, { showAll: false });
  const pricesToArchive = prices.filter((price) =>
    internalProductIds.includes(price.metadata?.[ctx.config.metadata.productIdField] ?? '')
  );

  if (pricesToArchive.length === 0) {
    ctx.logger.info('No prices to archive in Stripe');
    return;
  }

  for (const price of pricesToArchive) {
    try {
      await ctx.stripeClient.prices.update(price.id, {
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

// ------------------ ARCHIVE STRIPE SUBSCRIPTION PLANS ------------------
export async function archiveStripeSubscriptionPlans(
  ctx: Context,
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