import { existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type Stripe from 'stripe';
import type { DatabaseAdapter } from '@/definitions';

// Products table - mirrors the Stripe product structure
export const products = sqliteTable('products', {
  id: text('id').primaryKey(), // Internal product ID
  stripeId: text('stripe_id').unique(), // Stripe product ID
  name: text('name').notNull(),
  description: text('description'),
  active: integer('active', { mode: 'boolean' }).default(true),
  type: text('type').default('service'),
  features: text('features'), // JSON string for features
  marketingFeatures: text('marketing_features'), // JSON string for marketing features
  metadata: text('metadata'), // JSON string for additional metadata
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Prices table - mirrors the Stripe price structure
export const prices = sqliteTable('prices', {
  id: text('id').primaryKey(), // Internal price ID
  stripeId: text('stripe_id').unique(), // Stripe price ID
  productId: text('product_id').references(() => products.id),
  stripeProductId: text('stripe_product_id'),
  currency: text('currency').notNull(),
  unitAmount: integer('unit_amount'), // Amount in cents
  interval: text('interval'), // month, year, etc
  intervalCount: integer('interval_count').default(1),
  nickname: text('nickname'),
  active: integer('active', { mode: 'boolean' }).default(true),
  metadata: text('metadata'), // JSON string
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Price = typeof prices.$inferSelect;
export type NewPrice = typeof prices.$inferInsert;

/**
 * Creates a test SQLite database with schema
 */
export function createTestDatabase(): {
  db: ReturnType<typeof drizzle>;
  path: string;
  sqlite: Database.Database;
} {
  const dbPath = join(
    tmpdir(),
    `stripe-kit-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.db`
  );
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  // Create tables
  sqlite.exec(`
    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      stripe_id TEXT UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      active BOOLEAN DEFAULT 1,
      type TEXT DEFAULT 'service',
      features TEXT,
      marketing_features TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE prices (
      id TEXT PRIMARY KEY,
      stripe_id TEXT UNIQUE,
      product_id TEXT REFERENCES products(id),
      stripe_product_id TEXT,
      currency TEXT NOT NULL,
      unit_amount INTEGER,
      interval TEXT,
      interval_count INTEGER DEFAULT 1,
      nickname TEXT,
      active BOOLEAN DEFAULT 1,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return { db, path: dbPath, sqlite };
}

/**
 * Cleanup test database
 */
export function cleanupTestDatabase(
  dbPath: string,
  sqlite?: Database.Database
) {
  if (sqlite) {
    try {
      sqlite.close();
    } catch {
      // Database already closed
    }
  }

  if (existsSync(dbPath)) {
    try {
      unlinkSync(dbPath);
    } catch {
      // File already deleted or in use
    }
  }
}

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

/**
 * Converts Stripe product data to database format
 */
function buildProductData(stripeProduct: Stripe.Product, internalId: string) {
  return {
    id: internalId,
    stripeId: stripeProduct.id,
    name: stripeProduct.name,
    description: stripeProduct.description || null,
    active: stripeProduct.active ?? true,
    type: stripeProduct.type || 'service',
    features: stripeProduct.metadata?.features
      ? stripeProduct.metadata.features
      : null,
    marketingFeatures: stripeProduct.marketing_features
      ? JSON.stringify(stripeProduct.marketing_features)
      : null,
    metadata: stripeProduct.metadata
      ? JSON.stringify(stripeProduct.metadata)
      : null,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Converts Stripe price data to database format
 */
function buildPriceData(
  stripePrice: Stripe.Price,
  internalId: string,
  internalProductId: string
) {
  return {
    id: internalId,
    stripeId: stripePrice.id,
    productId: internalProductId,
    stripeProductId:
      typeof stripePrice.product === 'string'
        ? stripePrice.product
        : stripePrice.product?.id,
    currency: stripePrice.currency,
    unitAmount: stripePrice.unit_amount || null,
    interval: stripePrice.recurring?.interval || null,
    intervalCount: stripePrice.recurring?.interval_count || 1,
    nickname: stripePrice.nickname || null,
    active: stripePrice.active ?? true,
    metadata: stripePrice.metadata
      ? JSON.stringify(stripePrice.metadata)
      : null,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Updates or inserts a product record
 */
async function upsertProduct(
  db: ReturnType<typeof drizzle>,
  productData: NewProduct,
  internalId: string
) {
  const existing = await db
    .select()
    .from(products)
    .where(eq(products.id, internalId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(products)
      .set(productData)
      .where(eq(products.id, internalId));
  } else {
    await db.insert(products).values({
      ...productData,
      createdAt: new Date().toISOString(),
    });
  }
}

/**
 * Updates or inserts a price record
 */
async function upsertPrice(
  db: ReturnType<typeof drizzle>,
  priceData: NewPrice,
  internalId: string
) {
  const existing = await db
    .select()
    .from(prices)
    .where(eq(prices.id, internalId))
    .limit(1);

  if (existing.length > 0) {
    await db.update(prices).set(priceData).where(eq(prices.id, internalId));
  } else {
    await db.insert(prices).values({
      ...priceData,
      createdAt: new Date().toISOString(),
    });
  }
}

// ========================================================================
// DATABASE ADAPTER
// ========================================================================

/**
 * SQLite database adapter for testing - mirrors postgres adapter structure
 */
export function createSQLiteAdapter(
  db: ReturnType<typeof drizzle>
): DatabaseAdapter {
  return {
    async syncProducts(stripeProducts) {
      for (const stripeProduct of stripeProducts) {
        const internalId = stripeProduct.metadata?.internal_product_id;
        if (!internalId) {
          continue;
        }

        const productData = buildProductData(stripeProduct, internalId);
        await upsertProduct(db, productData, internalId);
      }
    },

    async syncPrices(stripePrices) {
      for (const stripePrice of stripePrices) {
        const internalId = stripePrice.metadata?.internal_price_id;
        const internalProductId = stripePrice.metadata?.internal_product_id;

        if (!(internalId && internalProductId)) {
          continue;
        }

        const priceData = buildPriceData(
          stripePrice,
          internalId,
          internalProductId
        );
        await upsertPrice(db, priceData, internalId);
      }
    },

    async clearProducts() {
      await db.delete(products);
    },

    async clearPrices() {
      await db.delete(prices);
    },

    async getProducts() {
      const allProducts = await db.select().from(products);
      return allProducts;
    },

    async getPrices() {
      const allPrices = await db.select().from(prices);
      return allPrices;
    },
  };
}
