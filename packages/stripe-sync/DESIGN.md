# stripe-sync Design Document

## Overview

`stripe-sync` is a configurable CLI tool for managing Stripe subscription plans and billing operations. It provides a generic, reusable solution that can be published and used across multiple projects without being tightly coupled to any specific codebase.

## Goals

- **Configurable**: Read configuration from a `stripe.config.ts` file instead of hardcoded values
- **Portable**: Can be installed as an npm package and used in any project
- **Extensible**: Supports custom adapters for database synchronization
- **Type-safe**: Full TypeScript support with proper type definitions
- **Environment-aware**: Support for multiple environments (test, dev, staging, prod)

## Architecture

### Core Components

1. **CLI Interface** (`src/cli.ts`)
   - Command-line interface using Commander.js
   - Interactive prompts for missing parameters
   - Environment and dialect selection
   - Production safety confirmations

2. **Configuration System** (`src/config/`)
   - `stripe.config.ts` loader and validator
   - Environment variable management
   - Configuration schema validation

3. **Task Engine** (`src/tasks/`)
   - Modular task system based on the reference implementation
   - Each operation (create, sync, archive, etc.) as separate modules
   - Generic context handling

4. **Adapter System** (`src/adapters/`)
   - Database adapter interface
   - Built-in adapters for common databases (Postgres, SQLite, Turso)
   - Custom adapter support via configuration

### Configuration File Structure

Users will create a `stripe.config.ts` file in their project root:

```typescript
import type { StripeConfig } from 'stripe-sync';

const config: StripeConfig = {
  // Stripe Plans Definition
  plans: [
    {
      id: 'basic',
      name: 'Basic Plan',
      description: 'Basic subscription plan',
      features: ['feature1', 'feature2'],
      prices: [
        {
          id: 'basic-monthly',
          interval: 'month',
          unitAmount: 999, // $9.99
          currency: 'usd'
        },
        {
          id: 'basic-yearly',
          interval: 'year',
          unitAmount: 9999, // $99.99
          currency: 'usd'
        }
      ]
    }
    // ... more plans
  ],

  // Environment Configuration
  environments: {
    test: { envFile: '.env.test' },
    dev: { envFile: '.env.dev' },
    staging: { envFile: '.env.staging' },
    prod: { envFile: '.env.prod' }
  },

  // Database Adapter Configuration
  adapter: {
    type: 'postgres', // or 'sqlite', 'turso', 'custom'
    // For custom adapters:
    // module: './my-custom-adapter.js'
  },

  // Optional: Custom Product IDs mapping
  productIds: {
    basic: 'basic',
    premium: 'premium'
    // ...
  }
};

export default config;
```

### Adapter Interface

Database adapters will implement a standard interface:

```typescript
interface DatabaseAdapter {
  // Connection management
  connect(config: AdapterConfig): Promise<void>;

  // Sync operations
  syncProducts(products: StripeProduct[]): Promise<void>;
  syncPrices(prices: StripePrice[]): Promise<void>;

  // Cleanup operations
  clearProducts(): Promise<void>;
  clearPrices(): Promise<void>;

  // Query operations (optional)
  getProducts?(): Promise<Product[]>;
  getPrices?(): Promise<Price[]>;
}
```

### Built-in Adapters

1. **PostgresAdapter** - Uses `drizzle-orm` with PostgreSQL
2. **SQLiteAdapter** - Uses `drizzle-orm` with SQLite
3. **TursoAdapter** - Uses `drizzle-orm` with Turso/LibSQL
4. **CustomAdapter** - Loads user-defined adapter modules

### CLI Commands

The CLI will support all operations from the reference implementation:

```bash
# Create/ensure plans exist in Stripe
stripe-sync create --env test

# Archive plans in Stripe
stripe-sync archive --env staging

# Sync Stripe data to database
stripe-sync sync --env dev --dialect postgres

# Update existing plans
stripe-sync update --env prod

# Clear database plans
stripe-sync clear-db-plans --env test --dialect sqlite

# List operations
stripe-sync list-products --env dev
stripe-sync list-prices --env dev

# Show Stripe dashboard URL
stripe-sync url
```

## Implementation Plan

### Phase 1: Core Infrastructure
1. Set up package structure and build system
2. Implement configuration loading system
3. Create basic CLI structure with Commander.js
4. Port core task functions from reference implementation

### Phase 2: Adapter System
1. Define adapter interface
2. Implement built-in database adapters
3. Add custom adapter loading capability
4. Create adapter configuration validation

### Phase 3: CLI Integration
1. Integrate tasks with CLI commands
2. Add interactive prompts and confirmations
3. Implement environment management
4. Add comprehensive error handling

### Phase 4: Testing & Documentation
1. Create comprehensive test suite
2. Add example configurations
3. Write usage documentation
4. Prepare for npm publishing

## Key Features

### Environment Management
- Automatic `.env` file loading based on environment
- Environment-specific configurations
- Production safety confirmations

### Interactive Mode
- Prompts for missing required parameters
- Environment and dialect selection
- Confirmation dialogs for dangerous operations

### Type Safety
- Full TypeScript support
- Configuration schema validation
- Runtime type checking for adapter implementations

### Extensibility
- Custom adapter support
- Configurable plan definitions
- Pluggable task system

## Migration Path

Users can migrate from the reference implementation by:

1. Installing `stripe-sync` package
2. Creating `stripe.config.ts` with their plan definitions
3. Implementing a custom adapter if needed (or using built-in ones)
4. Replacing direct script calls with `stripe-sync` CLI commands

This design maintains backward compatibility while providing a much more flexible and reusable solution.