import type Stripe from 'stripe';

import type { Context } from '@/types';

// ------------------ FETCH STRIPE PRODUCTS ------------------
export async function fetchStripeProducts(
  ctx: Context
): Promise<Stripe.Product[]> {
  ctx.logger.info('Fetching products from Stripe...');

  let hasMore = true;
  let startingAfter: string | undefined;
  let allStripeProducts: Stripe.Product[] = [];

  while (hasMore) {
    const response = await ctx.stripeClient.products.list({
      limit: 100,
      starting_after: startingAfter,
    });

    // Filter products that have internal metadata (our products)
    const filteredProducts = response.data.filter(
      (product) => product.metadata?.internal_product_id
    );
    allStripeProducts = [...allStripeProducts, ...filteredProducts];
    hasMore = response.has_more;
    startingAfter = response.data.at(-1)?.id;
  }

  return allStripeProducts;
}

// ------------------ FETCH STRIPE PRICES ------------------
export async function fetchStripePrices(ctx: Context): Promise<Stripe.Price[]> {
  ctx.logger.info('Fetching prices from Stripe...');

  let hasMore = true;
  let startingAfter: string | undefined;
  let allStripePrices: Stripe.Price[] = [];

  while (hasMore) {
    const response = await ctx.stripeClient.prices.list({
      limit: 100,
      starting_after: startingAfter,
    });

    // Filter prices that have internal metadata (our prices)
    const filteredPrices = response.data.filter(
      (price) => price.metadata?.internal_price_id
    );
    allStripePrices = [...allStripePrices, ...filteredPrices];
    hasMore = response.has_more;
    startingAfter = response.data.at(-1)?.id;
  }

  return allStripePrices;
}
