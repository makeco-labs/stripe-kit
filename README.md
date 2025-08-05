# stripe-kit

An unofficial CLI tool for managing Stripe subscription plans with database synchronization support.

## Installation

```sh
npm install @makeco/stripe-kit
```

## What's inside?

This monorepo includes the following packages:

### Packages

- `@makeco/stripe-kit`: Core CLI package for managing Stripe subscription plans
- `demos`: Example configurations and usage patterns

Each package is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```sh
cd stripe-kit
bun run build
```

### Usage

The CLI provides commands for managing Stripe subscription plans:

```sh
# Create subscription plans
stripe-kit create -e test

# Archive subscription plans  
stripe-kit archive -e staging

# Sync plans to database
stripe-kit sync -e dev -a postgres

# Database operations
stripe-kit db purge -e test -a postgres

# List products and prices
stripe-kit list products -e test
stripe-kit list prices -e test

# Quick access to Stripe dashboard URLs
stripe-kit urls
```

## Features

- **Stripe Integration**: Create, update, and archive subscription plans
- **Database Sync**: Synchronize Stripe data with your database (SQLite, PostgreSQL, Turso)
- **Multi-Environment**: Support for test, dev, staging, and production environments
- **Interactive CLI**: Guided prompts for all operations
- **Type Safety**: Built with TypeScript for reliable operations

## Configuration

Create a `stripe.config.js` file in your project root:

```js
export default {
  environments: {
    test: { envFile: '.env.test' },
    dev: { envFile: '.env.dev' },
    staging: { envFile: '.env.staging' },
    prod: { envFile: '.env.prod' }
  },
  plans: [
    {
      id: 'basic',
      name: 'Basic Plan',
      prices: [
        { amount: 999, currency: 'usd', interval: 'month' }
      ]
    }
  ]
}
```
