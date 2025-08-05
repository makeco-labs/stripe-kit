import type { Context } from '@/definitions';
import { listStripeProducts, listStripePrices } from '@/utils';

/**
 * Syncs managed subscription plans from Stripe to the database
 */
export async function syncStripeSubscriptionPlansAction(ctx: Context): Promise<void> {
  ctx.logger.info('Syncing Stripe subscription plans to database...');

  try {
    // Fetch managed products from Stripe (only those managed by this tool)
    ctx.logger.info('Fetching managed products from Stripe...');
    const stripeProducts = await listStripeProducts(ctx, { showAll: false });
    ctx.logger.info(`Found ${stripeProducts.length} managed products in Stripe`);

    // Fetch managed prices from Stripe (only those managed by this tool)
    ctx.logger.info('Fetching managed prices from Stripe...');
    const stripePrices = await listStripePrices(ctx, { showAll: false });
    ctx.logger.info(`Found ${stripePrices.length} managed prices in Stripe`);

    // Sync products to database
    ctx.logger.info('Syncing products to database...');
    await ctx.adapter.syncProducts(stripeProducts);
    ctx.logger.info('Products synced successfully');

    // Sync prices to database
    ctx.logger.info('Syncing prices to database...');
    await ctx.adapter.syncPrices(stripePrices);
    ctx.logger.info('Prices synced successfully');

    ctx.logger.info(`Successfully synced ${stripeProducts.length} products and ${stripePrices.length} prices from Stripe to database`);
  } catch (error) {
    ctx.logger.error('Error syncing Stripe subscription plans to database:', error);
    throw error;
  }
}