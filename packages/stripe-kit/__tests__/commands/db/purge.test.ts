import { count } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  cleanupTestDatabase,
  cli,
  createSQLiteAdapter,
  createTestDatabase,
  getTestStripeKey,
  products,
} from '../../helpers';

describe('stripe-kit db purge', () => {
  let testDb: ReturnType<typeof createTestDatabase>['db'];
  let testDbPath: string;
  let sqlite: ReturnType<typeof createTestDatabase>['sqlite'];
  let configPath: string;

  beforeEach(() => {
    const db = createTestDatabase();
    testDb = db.db;
    testDbPath = db.path;
    sqlite = db.sqlite;

    configPath = cli.createTempConfig({
      plans: [
        {
          product: { id: 'purge-test', name: 'Purge Test', type: 'service' },
          prices: [
            {
              id: 'purge-test-price',
              currency: 'usd',
              type: 'recurring',
              unitAmount: 2999,
            },
          ],
        },
      ],
      env: { stripeSecretKey: getTestStripeKey() },
      adapters: { sqlite: createSQLiteAdapter(testDb) },
      metadata: { managedByValue: '@makeco/stripe-kit-purge-test' },
    });
  });

  afterEach(() => {
    cleanupTestDatabase(testDbPath, sqlite);
    cli.cleanupTempConfig(configPath);
  });

  it('clears database', async () => {
    // Create and sync data first
    cli.create({ env: 'test', config: configPath });
    cli.sync({ env: 'test', adapter: 'sqlite', config: configPath });

    // Verify data exists
    const beforeCount = await testDb.select({ count: count() }).from(products);
    expect(beforeCount[0].count).toBeGreaterThan(0);

    // Purge
    const result = cli.purge({
      env: 'test',
      adapter: 'sqlite',
      config: configPath,
    });
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('purge');

    // Verify database is empty
    const afterCount = await testDb.select({ count: count() }).from(products);
    expect(afterCount[0].count).toBe(0);
  });
});
