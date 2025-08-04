# stripe-cmd

A configurable CLI tool and TypeScript library for managing Stripe subscription plans and billing operations.

## Installation

```bash
npm install stripe-cmd
```

## CLI Usage

```bash
# Ensure subscription plans exist in Stripe
stripe-cmd ensure-plans --config stripe.config.ts

# Archive subscription plans in Stripe
stripe-cmd archive-plans --config stripe.config.ts
```

## API Usage

```typescript
import { 
  loadStripeConfig, 
  createStripeClient,
  createAdapter,
  ensureStripeSubscriptionPlans,
  archiveStripeSubscriptionPlans 
} from 'stripe-cmd';

// Load configuration
const config = await loadStripeConfig('stripe.config.ts');

// Create Stripe client
const stripe = createStripeClient({ apiKey: process.env.STRIPE_SECRET_KEY! });

// Create database adapter
const adapter = createAdapter({
  dialect: 'postgres',
  connectionString: process.env.DATABASE_URL!
});

// Ensure plans exist
await ensureStripeSubscriptionPlans({ config, stripe, adapter });

// Archive plans
await archiveStripeSubscriptionPlans({ config, stripe, adapter });
```

## Configuration

Create a `stripe.config.ts` file:

```typescript
import { createStripeConfig } from 'stripe-cmd';

export default createStripeConfig({
  plans: [
    {
      id: 'basic-plan',
      name: 'Basic Plan',
      prices: [
        {
          id: 'basic-monthly',
          interval: 'month',
          unitAmount: 999,
          currency: 'usd'
        }
      ]
    }
  ],
  adapter: {
    type: 'postgres'
  }
});
```

## Database Support

Supports PostgreSQL, MySQL, and SQLite via Drizzle ORM adapters.