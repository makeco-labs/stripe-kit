import type Stripe from 'stripe';

import type { Context } from '@/definitions';

// ========================================================================
// FIND OPERATIONS (PRECISE SEARCH)
// ========================================================================

// ------------------ FIND STRIPE PRODUCT ------------------
export async function findStripeProduct(
  ctx: Context,
  input: { internalProductId: string }
): Promise<Stripe.Product | null> {
  const { internalProductId } = input;
  const { metadata } = ctx.config;

  const searchResult = await ctx.stripeClient.products.search({
    query: `metadata['${metadata.productIdField}']:'${internalProductId}' AND metadata['${metadata.managedByField}']:'${metadata.managedByValue}' AND active:'true'`,
    limit: 1,
  });

  const product = searchResult.data.length > 0 ? searchResult.data[0] : null;
  return product ? product : null;
}

// ------------------ FIND STRIPE PRICE ------------------
export async function findStripePrice(
  ctx: Context,
  input: { internalPriceId: string; stripeProductId: string }
): Promise<Stripe.Price | null> {
  const { internalPriceId, stripeProductId } = input;
  const { metadata } = ctx.config;

  const searchResult = await ctx.stripeClient.prices.search({
    query: `product:'${stripeProductId}' AND metadata['${metadata.priceIdField}']:'${internalPriceId}' AND metadata['${metadata.managedByField}']:'${metadata.managedByValue}' AND active:'true'`,
    limit: 1,
  });

  const price = searchResult.data.length > 0 && searchResult.data[0];
  return price ? price : null;
}

// ========================================================================
// LIST OPERATIONS (BULK FETCH WITH PAGINATION)
// ========================================================================

// ------------------ LIST STRIPE PRODUCTS ------------------
export async function listStripeProducts(
  ctx: Context,
  options: { showAll?: boolean } = {}
): Promise<Stripe.Product[]> {
  const { showAll = false } = options;
  ctx.logger.info(`Fetching ${showAll ? 'all' : 'managed'} products from Stripe...`);

  let hasMore = true;
  let startingAfter: string | undefined;
  let allStripeProducts: Stripe.Product[] = [];

  while (hasMore) {
    const response = await ctx.stripeClient.products.list({
      limit: 100,
      starting_after: startingAfter,
    });

    let productsToInclude: Stripe.Product[];
    
    if (showAll) {
      // Include all products
      productsToInclude = response.data;
    } else {
      // Filter products that are managed by this tool
      productsToInclude = response.data.filter(
        (product) => 
          product.metadata?.[ctx.config.metadata.productIdField] &&
          product.metadata?.[ctx.config.metadata.managedByField] === ctx.config.metadata.managedByValue
      );
    }
    
    allStripeProducts = [...allStripeProducts, ...productsToInclude];
    hasMore = response.has_more;
    startingAfter = response.data.at(-1)?.id;
  }

  return allStripeProducts;
}

// ------------------ LIST STRIPE PRICES ------------------
export async function listStripePrices(
  ctx: Context,
  options: { showAll?: boolean } = {}
): Promise<Stripe.Price[]> {
  const { showAll = false } = options;
  ctx.logger.info(`Fetching ${showAll ? 'all' : 'managed'} prices from Stripe...`);

  let hasMore = true;
  let startingAfter: string | undefined;
  let allStripePrices: Stripe.Price[] = [];

  while (hasMore) {
    const response = await ctx.stripeClient.prices.list({
      limit: 100,
      starting_after: startingAfter,
    });

    let pricesToInclude: Stripe.Price[];
    
    if (showAll) {
      // Include all prices
      pricesToInclude = response.data;
    } else {
      // Filter prices that are managed by this tool
      pricesToInclude = response.data.filter(
        (price) =>
          price.metadata?.[ctx.config.metadata.priceIdField] &&
          price.metadata?.[ctx.config.metadata.managedByField] === ctx.config.metadata.managedByValue
      );
    }
    
    allStripePrices = [...allStripePrices, ...pricesToInclude];
    hasMore = response.has_more;
    startingAfter = response.data.at(-1)?.id;
  }

  return allStripePrices;
}