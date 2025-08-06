import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cli, getTestStripeKey } from '../../helpers';

describe('stripe-kit list products', () => {
  let configPath: string;

  beforeEach(() => {
    configPath = cli.createTempConfig({
      plans: [
        {
          product: {
            id: 'list-test',
            name: 'List Test Product',
            type: 'service',
          },
          prices: [
            {
              id: 'list-test-price',
              currency: 'usd',
              type: 'recurring',
              unitAmount: 999,
            },
          ],
        },
      ],
      env: { stripeSecretKey: getTestStripeKey() },
      adapters: {},
      metadata: { managedByValue: '@makeco/stripe-kit-list-test' },
    });

    // Ensure products exist
    cli.create({ env: 'test', config: configPath });
  });

  afterEach(() => {
    cli.cleanupTempConfig(configPath);
  });

  it('lists products', () => {
    const result = cli.listProducts({ env: 'test' });
    expect(result.success).toBe(true);
  });

  it('shows all products with --all flag', () => {
    const result = cli.listProducts({ env: 'test', all: true });
    expect(result.success).toBe(true);
  });
});
