import Stripe from 'stripe';

export function createStripeClient(env: Record<string, string | undefined>): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required');
  }

  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil',
  });
}
