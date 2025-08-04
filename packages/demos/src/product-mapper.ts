import type { SubscriptionPlan } from '@makeco/stripe-sync';
import type Stripe from 'stripe';

/**
 * Custom mapper for subscription plans to Stripe products
 * Adds business-specific metadata and customization
 */
export function mapSubscriptionPlanToStripeProduct(plan: SubscriptionPlan): Stripe.ProductCreateParams {
  return {
    name: `${plan.name} Plan`, // Add "Plan" suffix
    description: plan.description,
    metadata: {
      internal_product_id: plan.id,
      features: JSON.stringify(plan.features || []),
      // Business-specific metadata
      plan_category: plan.id === 'free' ? 'freemium' : 'paid',
      target_audience:
        plan.id === 'free'
          ? 'individual'
          : plan.id === 'pro'
            ? 'small-business'
            : 'enterprise',
      feature_count: plan.features.length.toString(),
      created_by: '@makeco/stripe-sync',
      version: '1.0',
      // Marketing metadata
      trial_eligible: plan.id !== 'free' ? 'true' : 'false',
      popular_plan: plan.id === 'pro' ? 'true' : 'false',
      upgrade_path:
        plan.id === 'free'
          ? 'pro'
          : plan.id === 'pro'
            ? 'enterprise'
            : 'none',
    },
    // Stripe-specific product configuration
    tax_code: 'txcd_10103001', // Software as a Service
    images: [], // Could add product images URLs
    package_dimensions: undefined,
    shippable: false,
    unit_label: 'subscription',
  };
}