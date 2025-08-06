import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cli, getTestStripeKey } from '../../helpers';

describe('stripe-kit list prices', () => {
  let configPath: string;

  beforeEach(() => {
    configPath = cli.createTempConfig({
      plans: [
        {
          product: {
            id: 'price-list-test',
            name: 'Price List Test',
            type: 'service',
          },
          prices: [
            {
              id: 'price-list-test-price',
              currency: 'usd',
              type: 'recurring',
              unitAmount: 1999,
            },
          ],
        },
      ],
      env: { stripeSecretKey: getTestStripeKey() },
      adapters: {},
      metadata: { managedByValue: '@makeco/stripe-kit-price-list-test' },
    });

    // Ensure prices exist
    cli.create({ env: 'test', config: configPath });
  });

  afterEach(() => {
    cli.cleanupTempConfig(configPath);
  });

  it('lists prices', () => {
    const result = cli.listPrices({ env: 'test' });
    expect(result.success).toBe(true);
  });

  it('shows all prices with --all flag', () => {
    const result = cli.listPrices({ env: 'test', all: true });
    expect(result.success).toBe(true);
  });
});
