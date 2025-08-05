# stripe-kit

[![npm version](https://badge.fury.io/js/%40makeco%2Fstripe-kit.svg)](https://badge.fury.io/js/%40makeco%2Fstripe-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/makeco/stripe-kit)](https://github.com/makeco/stripe-kit/issues)
[![GitHub stars](https://img.shields.io/github/stars/makeco/stripe-kit)](https://github.com/makeco/stripe-kit/stargazers)

An unofficial CLI tool for creating, archiving, updating Stripe products and prices and syncing them to your database.

## Installation

```bash
npm install @makeco/stripe-kit
```

## CLI Usage

### Core Commands

```bash
# Create subscription plans in Stripe
stripe-kit create -e dev -a postgres

# Archive subscription plans in Stripe
stripe-kit archive -e prod -a postgres

# Sync Stripe plans to database
stripe-kit sync -e staging -a postgres

# Update existing Stripe plans
stripe-kit update -e prod -a postgres

# Database operations
stripe-kit db purge -e dev -a postgres
```

### Utility Commands

```bash
# Show Stripe dashboard URLs
stripe-kit urls                    # Interactive selection (shows both live & test URLs)
stripe-kit urls -a                 # Show all URLs with labels

# List Stripe products
stripe-kit list products -e dev --all

# List Stripe prices
stripe-kit list prices -e dev --all

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

Preferences are stored in `~/.config/@makeco/stripe-kit/config.json`

## Subcommands

### Database Operations

```bash
# Show available database operations
stripe-kit db

# Purge database plans
stripe-kit db purge -e dev -a postgres
```

### List Operations

```bash
# Show available list operations
stripe-kit list

# List products
stripe-kit list products -e dev --all

# List prices
stripe-kit list prices -e dev --all
```

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