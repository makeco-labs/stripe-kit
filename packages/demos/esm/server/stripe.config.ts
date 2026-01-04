import { defineConfig } from '@makeco/stripe-kit';
// This import chain should cause the ESM resolution issue:
// stripe.config.ts -> ./src/database-adapter.ts -> @demo/esm-db (workspace package)
import { serverDatabaseAdapter } from './src/database-adapter';

export const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export default defineConfig({
  plans: [
    {
      id: 'basic',
      product: {
        name: 'Basic Plan',
        description: 'ESM test plan',
        active: true,
        type: 'service',
        marketing_features: [
          { name: '10 projects' },
          { name: 'Basic support' },
        ],
        metadata: {
          plan_category: 'paid',
          target_audience: 'individual',
        },
      },
      prices: [
        {
          id: 'basic-monthly',
          currency: 'usd',
          billing_scheme: 'per_unit',
          unit_amount: 999, // $9.99
          recurring: {
            interval: 'month',
            interval_count: 1,
            usage_type: 'licensed',
          },
          nickname: 'Basic Monthly',
          active: true,
          metadata: {
            billing_cycle: 'monthly',
          },
        },
      ],
    },
  ],

  // Environment variables
  env: {
    stripeSecretKey,
  },

  // Use the server database adapter that imports from workspace package
  adapters: {
    postgres: serverDatabaseAdapter,
  },

  // Metadata configuration
  metadata: {
    productIdField: 'internal_product_id',
    priceIdField: 'internal_price_id',
    managedByField: 'managed_by',
    managedByValue: 'stripe-kit-esm-demo',
  },
});
