import { createStripeConfig } from '@makeco/stripe-sync';
import { mapSubscriptionPlanToStripeProduct } from './product-mapper.js';
import { mapSubscriptionPlanToStripePrice } from './price-mapper.js';

const config = createStripeConfig({
  // Complete subscription plan setup demonstrating all features
  plans: [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      features: [
        '5 projects',
        'Basic support',
        '1GB storage',
        'Community access',
      ],
      prices: [
        {
          id: 'free-monthly',
          interval: 'month',
          unitAmount: 0, // Free tier
          currency: 'usd',
        },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For growing businesses',
      features: [
        'Unlimited projects',
        'Priority support',
        '50GB storage',
        'Advanced analytics',
        'API access',
        'Custom integrations',
      ],
      prices: [
        {
          id: 'pro-monthly',
          interval: 'month',
          unitAmount: 2999, // $29.99
          currency: 'usd',
        },
        {
          id: 'pro-yearly',
          interval: 'year',
          unitAmount: 29_999, // $299.99 (save ~17%)
          currency: 'usd',
        },
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations',
      features: [
        'Everything in Pro',
        'Dedicated support',
        'Unlimited storage',
        'SSO/SAML',
        'Audit logs',
        'SLA guarantee',
        'Custom onboarding',
      ],
      prices: [
        {
          id: 'enterprise-monthly',
          interval: 'month',
          unitAmount: 9999, // $99.99
          currency: 'usd',
        },
        {
          id: 'enterprise-yearly',
          interval: 'year',
          unitAmount: 99_999, // $999.99 (save ~17%)
          currency: 'usd',
        },
      ],
    },
  ],

  // Environment configuration for different deployment stages
  environments: {
    test: { envFile: '.env.test' },
    dev: { envFile: '.env.dev' },
    staging: { envFile: '.env.staging' },
    prod: { envFile: '.env.prod' },
  },

  // Database adapter with custom mappers demonstrating all customization options
  adapter: {
    type: 'postgres',

    // Custom mappers to add business-specific metadata and customize Stripe objects
    mappers: {
      mapSubscriptionPlanToStripeProduct,
      mapSubscriptionPlanToStripePrice,
    },
  },

  // Map internal plan IDs to product identifiers
  productIds: {
    free: 'free',
    pro: 'pro',
    enterprise: 'enterprise',
  },
});

export default config;
