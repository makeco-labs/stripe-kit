# @makeco/stripe-sync

A CLI tool for managing Stripe subscription plans with database synchronization support.

## Installation

```sh
npm install @makeco/stripe-sync
```

## What's inside?

This monorepo includes the following packages:

### Packages

- `@makeco/stripe-sync`: Core CLI package for managing Stripe subscription plans
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
cd @makeco/stripe-sync
bun run build
```

### Usage

The CLI provides commands for managing Stripe subscription plans:

```sh
# Create subscription plans
stripe-sync create --env test

# Archive subscription plans  
stripe-sync archive --env staging

# Sync plans to database
stripe-sync sync --env dev --dialect postgres

# List products and prices
stripe-sync list-products --env test
stripe-sync list-prices --env test
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
