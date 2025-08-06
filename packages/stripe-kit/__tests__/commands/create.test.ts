import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cli, getTestStripeKey } from '../helpers';

describe('stripe-kit create', () => {
  let configPath: string;

  beforeEach(() => {
    configPath = cli.createTempConfig({
      plans: [
        {
          product: { id: 'test-create', name: 'Test Create', type: 'service' },
          prices: [
            {
              id: 'test-create-price',
              currency: 'usd',
              type: 'recurring',
              unitAmount: 999,
            },
          ],
        },
      ],
      env: { stripeSecretKey: getTestStripeKey() },
      adapters: {},
      metadata: { managedByValue: '@makeco/stripe-kit-create-test' },
    });
  });

  afterEach(() => {
    cli.cleanupTempConfig(configPath);
  });

  it('creates products in Stripe', () => {
    const result = cli.create({ env: 'test', config: configPath });
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('created');
  });

  it('handles missing config', () => {
    const result = cli.create({ env: 'test', config: '/invalid/path' });
    expect(result.success).toBe(false);
  });
});
