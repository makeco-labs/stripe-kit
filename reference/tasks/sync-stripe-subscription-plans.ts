import {
  mapStripePriceToBillingPrice,
  mapStripeProductToBillingProduct,
} from '@billing/infra/external/stripe/mappers';
import {
  stripePriceMetadataSchema,
  stripeProductMetadataSchema,
} from '@billing/infra/external/stripe/schemas';

import { billingPrices, billingProducts } from '@infra/db/tables';
import type { InsertBillingPrice, InsertBillingProduct } from '@infra/db/types';
import type {
  CoreContext,
  DatabaseContext,
  WithClient,
} from '@platform/context';
import { eq, inArray, isNotNull } from 'drizzle-orm';
import type Stripe from 'stripe';
import { fetchStripePrices, fetchStripeProducts } from './stripe-fetch-utils';

// ------------------ PRIVATE FUNCTIONS ------------------

/**
 * Persists Stripe products to the database.
 *
 * Logic flow:
 * 1. Fetches all existing products from the database.
 * 2. Identifies products to insert and update by comparing Stripe products with existing products.
 * 3. Inserts new products into the database.
 * 4. Updates existing products in the database.
 */
async function persistProductsToDatabase(
  ctx: WithClient<DatabaseContext, 'payment'>,
  input: {
    stripeProducts: Stripe.Product[];
  }
) {
  const { stripeProducts } = input;

  // Fetch all existing products from the database
  const existingProducts = await ctx.db
    .select()
    .from(billingProducts)
    .where(isNotNull(billingProducts.id)); // Fetch all products

  const existingProductIds = new Set(
    existingProducts.map((product) => product.id)
  );

  const productsToInsert: InsertBillingProduct[] = [];
  const productsToUpdate: InsertBillingProduct[] = [];
  const productIdsToDelete: string[] = [];

  const stripeProductIds = new Set<string>();

  // Map Stripe products to the database model
  for (const stripeProduct of stripeProducts) {
    const metadata = stripeProductMetadataSchema.parse({
      ...stripeProduct.metadata,
      features: JSON.parse(stripeProduct.metadata?.features || '[]'),
    });
    const mappedProduct = mapStripeProductToBillingProduct(stripeProduct, {
      internalProductId: metadata.internal_product_id,
    });

    stripeProductIds.add(metadata.internal_product_id);

    // If product is archived in Stripe, mark it for deletion
    if (existingProductIds.has(metadata.internal_product_id)) {
      // Product exists, add to update list
      productsToUpdate.push(mappedProduct);
    } else {
      // Product doesn't exist, add to insert list
      productsToInsert.push(mappedProduct);
    }
  }

  // Identify products that exist in the database but not in Stripe (those to be deleted)
  for (const product of existingProducts) {
    if (!stripeProductIds.has(product.id)) {
      // If product ID from the database doesn't exist in Stripe, mark it for deletion
      productIdsToDelete.push(product.id);
    }
  }

  // Bulk insert and update
  if (productsToInsert.length > 0) {
    ctx.logger.info(`Inserting ${productsToInsert.length} products...`);
    await ctx.db.insert(billingProducts).values(productsToInsert);
    for (const product of productsToInsert) {
      ctx.logger.info(`Inserted product id: ${product.id} - ${product.name}`);
    }
  }

  if (productsToUpdate.length > 0) {
    for (const product of productsToUpdate) {
      if (!product.id) {
        throw new Error(`Product ID is required for ${product.name}`);
      }

      await ctx.db
        .update(billingProducts)
        .set(product)
        .where(eq(billingProducts.id, product.id));
      ctx.logger.info(`Updated product id: ${product.id} - ${product.name}`);
    }
  }

  // Delete prices first and then products
  if (productIdsToDelete.length > 0) {
    ctx.logger.info(`Deleting ${productIdsToDelete.length} products...`);
    await ctx.db.transaction(async (tx) => {
      await tx
        .delete(billingPrices)
        .where(inArray(billingPrices.id, productIdsToDelete));

      await tx
        .delete(billingProducts)
        .where(inArray(billingProducts.id, productIdsToDelete));
    });

    for (const productId of productIdsToDelete) {
      ctx.logger.info(`Deleted product id: ${productId}`);
    }
  }

  ctx.logger.info('Finished syncing products.');
}

/**
 * Persists Stripe prices to the database.
 *
 * Logic flow:
 * 1. Fetches all existing prices from the database.
 * 2. Identifies prices to insert and update by comparing Stripe prices with existing prices.
 * 3. Inserts new prices into the database.
 * 4. Updates existing prices in the database.
 */
async function persistPricesToDatabase(
  ctx: WithClient<DatabaseContext, 'payment'>,
  input: {
    stripePrices: Stripe.Price[];
  }
) {
  const { stripePrices } = input;

  // Fetch all existing prices from the database
  const existingPrices = await ctx.db
    .select()
    .from(billingPrices)
    .where(isNotNull(billingPrices.id)); // Fetch all prices
  const existingPriceIds = new Set(existingPrices.map((price) => price.id));

  const pricesToInsert: InsertBillingPrice[] = [];
  const pricesToUpdate: InsertBillingPrice[] = [];
  const priceIdsToDelete: string[] = [];

  // Map Stripe prices to the database model
  for (const stripePrice of stripePrices) {
    const metadata = stripePriceMetadataSchema.parse(stripePrice.metadata);
    const mappedPrice = mapStripePriceToBillingPrice(stripePrice, {
      internalPriceId: metadata.internal_price_id,
      internalProductId: metadata.internal_product_id,
    });

    // If price is archived in Stripe, mark it for deletion
    if (stripePrice.active === false) {
      priceIdsToDelete.push(metadata.internal_price_id); // Add price ID to deletion list
    } else if (existingPriceIds.has(metadata.internal_price_id)) {
      // Price exists, add to update list
      pricesToUpdate.push(mappedPrice);
    } else {
      // Price doesn't exist, add to insert list
      pricesToInsert.push(mappedPrice);
    }
  }

  // Bulk insert and update
  if (pricesToInsert.length > 0) {
    await ctx.db.insert(billingPrices).values(pricesToInsert);
  }

  if (pricesToUpdate.length > 0) {
    for (const price of pricesToUpdate) {
      if (!price.id) {
        throw new Error(`Price ID is required for ${price.productId}`);
      }

      await ctx.db
        .update(billingPrices)
        .set(price)
        .where(eq(billingPrices.id, price.id));
    }
  }

  if (priceIdsToDelete.length > 0) {
    await ctx.db
      .delete(billingPrices)
      .where(inArray(billingPrices.id, priceIdsToDelete));
  }

  ctx.logger.info('Finished syncing prices.');
}

// ------------------ PUBLIC FUNCTIONS ------------------

/**
 * Syncs products and prices from Stripe into the database.
 *
 * Logic flow:
 * 1. Fetches all products from Stripe and persists them to the database.
 * 2. Fetches all prices from Stripe and persists them to the database.
 */
export async function syncStripeSubscriptionPlans(
  ctx: WithClient<DatabaseContext, 'payment'>
): Promise<void> {
  ctx.logger.info('Syncing Stripe products and prices...');

  const stripeProducts = await fetchStripeProducts(ctx);
  await persistProductsToDatabase(ctx, { stripeProducts });

  const stripePrices = await fetchStripePrices(ctx);
  await persistPricesToDatabase(ctx, { stripePrices });

  ctx.logger.info('Finished syncing Stripe products and prices.');
}
