# stripe-kit

A configurable CLI tool and TypeScript library for managing Stripe subscription plans and billing operations.

## Installation

```bash
npm install stripe-kit
```

## CLI Usage

### Core Commands

```bash
# Create subscription plans in Stripe
stripe-kit create --env dev --adapter postgres

# Archive subscription plans in Stripe
stripe-kit archive --env prod --adapter postgres

# Sync Stripe plans to database
stripe-kit sync --env staging --adapter postgres

# Update existing Stripe plans
stripe-kit update --env prod --adapter postgres

# Clear database plans
stripe-kit clear-db-plans --env dev --adapter postgres
```

### Utility Commands

```bash
# Show Stripe dashboard URLs
stripe-kit urls                    # Interactive selection (shows both live & test URLs)  
stripe-kit urls -a                 # Show all URLs with labels

# List Stripe products
stripe-kit list-products --env dev --all

# List Stripe prices  
stripe-kit list-prices --env dev --all

# View current user preferences
stripe-kit config
```

### Global Options

- `-c, --config <path>` - Path to stripe.config.ts file (defaults to ./stripe.config.ts)
- `-e, --env <environment>` - Target environment (test, dev, staging, prod)
- `-a, --adapter <name>` - Database adapter name

## User Preferences

The CLI remembers your last used environment and adapter selections for faster workflow:

```bash
# First time - you'll be prompted to select
stripe-kit create

# Subsequent runs - your last selection is pre-selected
stripe-kit archive  # Uses your last environment/adapter as initial choice

# View current preferences
stripe-kit config
```

Preferences are stored in `~/.config/stripe-kit/config.json`

## API Usage

```typescript
import { defineConfig } from 'stripe-kit';

// Use the configuration helper
export default defineConfig({
  plans: [
    {
      product: {
        id: 'basic-plan',
        name: 'Basic Plan',
        description: 'Our basic subscription plan'
      },
      prices: [
        {
          id: 'basic-monthly',
          nickname: 'Basic Monthly',
          unitAmount: 999,
          currency: 'usd',
          recurring: { interval: 'month' }
        }
      ]
    }
  ],
  adapters: {
    postgres: {
      // Your database adapter configuration
      connectionString: process.env.DATABASE_URL
    }
  }
});
```

## Configuration

Create a `stripe.config.ts` file in your project root:

```typescript
import { defineConfig } from 'stripe-kit';

export default defineConfig({
  plans: [
    {
      product: {
        id: 'pro-plan',
        name: 'Pro Plan',
        description: 'Professional features for growing teams'
      },
      prices: [
        {
          id: 'pro-monthly',
          nickname: 'Pro Monthly',
          unitAmount: 2999,
          currency: 'usd',
          recurring: { interval: 'month' }
        },
        {
          id: 'pro-yearly',
          nickname: 'Pro Yearly',
          unitAmount: 29999,
          currency: 'usd',
          recurring: { interval: 'year' }
        }
      ]
    }
  ],
  adapters: {
    postgres: {
      // Your PostgreSQL adapter configuration
      connectionString: process.env.DATABASE_URL
    }
  },
  // Optional: Custom mappers for your database schema
  mappers: {
    // Define how to map Stripe objects to your database schema
  }
});
```

## Environment Variables

Create environment files for different stages:

```bash
# .env.development
STRIPE_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...

# .env.production  
STRIPE_SECRET_KEY=sk_live_...
DATABASE_URL=postgresql://...
```

## Database Support

Supports PostgreSQL, MySQL, and SQLite via custom database adapters. The CLI automatically detects and uses your configured adapters.