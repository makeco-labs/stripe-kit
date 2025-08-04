import { billingConfig } from '@billing/domain';
import type { CoreContext, WithClient } from '@platform/context';
import { assertStripeClient } from '@platform/context';
import type Stripe from 'stripe';

// ------------------ PUBLIC FUNCTIONS ------------------

/**
 * Fetches all products from Stripe that belong to the application.
 * It handles pagination to retrieve all products.
 */
export async function fetchStripeProducts(
  ctx: WithClient<Pick<CoreContext, 'logger'>, 'payment'>
): Promise<Stripe.Product[]> {
  // ------------------ ASSERTIONS ------------------
  assertStripeClient(ctx.payment);

  ctx.logger.info('Fetching products from Stripe...');

  let hasMore = true;
  let startingAfter: string | undefined;
  let allStripeProducts: Stripe.Product[] = [];

  while (hasMore) {
    const response = await ctx.payment.stripeClient.products.list({
      limit: 100,
      starting_after: startingAfter,
    });

    const filteredProducts = response.data.filter(
      (product) =>
        product.metadata?.application_id === billingConfig.applicationId
    );
    allStripeProducts = [...allStripeProducts, ...filteredProducts];
    hasMore = response.has_more;
    startingAfter = response.data.at(-1)?.id;
  }

  return allStripeProducts;
}

/**
 * Fetches all prices from Stripe that belong to the application.
 * It handles pagination to retrieve all prices.
 */
export async function fetchStripePrices(
  ctx: WithClient<Pick<CoreContext, 'logger'>, 'payment'>
): Promise<Stripe.Price[]> {
  // ------------------ ASSERTIONS ------------------
  assertStripeClient(ctx.payment);

  ctx.logger.info('Fetching prices from Stripe...');

  let hasMore = true;
  let startingAfter: string | undefined;
  let allStripePrices: Stripe.Price[] = [];

  while (hasMore) {
    const response = await ctx.payment.stripeClient.prices.list({
      limit: 100,
      starting_after: startingAfter,
    });

    const filteredPrices = response.data.filter(
      (price) => price.metadata?.application_id === billingConfig.applicationId
    );
    allStripePrices = [...allStripePrices, ...filteredPrices];
    hasMore = response.has_more;
    startingAfter = response.data.at(-1)?.id;
  }

  return allStripePrices;
}
