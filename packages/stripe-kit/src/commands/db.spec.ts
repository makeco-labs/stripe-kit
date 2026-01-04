import { count } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  cleanupTestDatabase,
  cli,
  createSQLiteAdapter,
  createTestDatabase,
  getTestStripeKey,
  products,
} from "@/test-utils";

// Note: These tests are skipped because the CLI runner uses temp config files
// which can't include database adapter functions (they can't be serialized).
// To properly test db sync/purge, we would need either:
// 1. Direct function testing (not through CLI)
// 2. A real config file with adapters
// 3. A different test architecture

describe.skip("stripe-kit db sync", () => {
  let testDb: ReturnType<typeof createTestDatabase>["db"];
  let testDbPath: string;
  let sqlite: ReturnType<typeof createTestDatabase>["sqlite"];
  let configPath: string;

  beforeEach(() => {
    const db = createTestDatabase();
    testDb = db.db;
    testDbPath = db.path;
    sqlite = db.sqlite;

    configPath = cli.createTempConfig({
      plans: [
        {
          id: "sync-test",
          product: { name: "Sync Test", type: "service" },
          prices: [
            {
              id: "sync-test-price",
              currency: "usd",
              unit_amount: 1999,
              recurring: { interval: "month" },
            },
          ],
        },
      ],
      env: { stripeSecretKey: getTestStripeKey() },
      adapters: { sqlite: createSQLiteAdapter(testDb) },
      metadata: { managedByValue: "@makeco/stripe-kit-sync-test" },
    });
  });

  afterEach(() => {
    cleanupTestDatabase(testDbPath, sqlite);
    cli.cleanupTempConfig(configPath);
  });

  it("syncs Stripe data to database", async () => {
    // First create products
    cli.create({ env: "test", config: configPath });

    // Then sync
    const result = cli.sync({
      env: "test",
      adapter: "sqlite",
      config: configPath,
    });
    expect(result.success).toBe(true);
    expect(result.stdout).toContain("sync");

    // Verify database has data
    const productsResult = await testDb.select().from(products);
    expect(productsResult.length).toBeGreaterThan(0);
  });
});

describe.skip("stripe-kit db purge", () => {
  let testDb: ReturnType<typeof createTestDatabase>["db"];
  let testDbPath: string;
  let sqlite: ReturnType<typeof createTestDatabase>["sqlite"];
  let configPath: string;

  beforeEach(() => {
    const db = createTestDatabase();
    testDb = db.db;
    testDbPath = db.path;
    sqlite = db.sqlite;

    configPath = cli.createTempConfig({
      plans: [
        {
          id: "purge-test",
          product: { name: "Purge Test", type: "service" },
          prices: [
            {
              id: "purge-test-price",
              currency: "usd",
              unit_amount: 2999,
              recurring: { interval: "month" },
            },
          ],
        },
      ],
      env: { stripeSecretKey: getTestStripeKey() },
      adapters: { sqlite: createSQLiteAdapter(testDb) },
      metadata: { managedByValue: "@makeco/stripe-kit-purge-test" },
    });
  });

  afterEach(() => {
    cleanupTestDatabase(testDbPath, sqlite);
    cli.cleanupTempConfig(configPath);
  });

  it("clears database", async () => {
    // Create and sync data first
    cli.create({ env: "test", config: configPath });
    cli.sync({ env: "test", adapter: "sqlite", config: configPath });

    // Verify data exists
    const beforeCount = await testDb.select({ count: count() }).from(products);
    expect(beforeCount[0].count).toBeGreaterThan(0);

    // Purge
    const result = cli.purge({
      env: "test",
      adapter: "sqlite",
      config: configPath,
    });
    expect(result.success).toBe(true);
    expect(result.stdout).toContain("purge");

    // Verify database is empty
    const afterCount = await testDb.select({ count: count() }).from(products);
    expect(afterCount[0].count).toBe(0);
  });
});
