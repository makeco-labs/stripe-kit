import type Stripe from 'stripe';

import type {
  Config,
  StripeMappers,
  StripePriceContext,
  SubscriptionPlan,
  StripePrice,
} from '@/schemas';

export function createMappers(config: Config): StripeMappers {
  const metadataConfig = config.metadata;
  
  return {
    mapSubscriptionPlanToStripeProduct: (
      plan: SubscriptionPlan
    ): Stripe.ProductCreateParams => {
      return {
        name: plan.product.name,
        description: plan.product.description,
        active: plan.product.active,
        type: plan.product.type,
        images: plan.product.images,
        marketing_features: plan.product.marketingFeatures?.map(f => ({ name: f.name })),
        url: plan.product.url,
        statement_descriptor: plan.product.statementDescriptor,
        tax_code: plan.product.taxCode,
        unit_label: plan.product.unitLabel,
        package_dimensions: plan.product.packageDimensions ? {
          height: plan.product.packageDimensions.height,
          length: plan.product.packageDimensions.length,
          weight: plan.product.packageDimensions.weight,
          width: plan.product.packageDimensions.width,
        } : undefined,
        metadata: {
          [metadataConfig.productIdField]: plan.product.id,
          [metadataConfig.managedByField]: metadataConfig.managedByValue,
          features: JSON.stringify(plan.product.features || {}),
          ...plan.product.metadata,
        },
      };
    },

    mapSubscriptionPlanToStripePrice: (
      price: StripePrice,
      context: StripePriceContext
    ): Stripe.PriceCreateParams => {
      return {
        product: context.stripeProductId,
        unit_amount: price.unitAmount,
        unit_amount_decimal: price.unitAmountDecimal,
        currency: price.currency,
        billing_scheme: price.billingScheme,
        nickname: price.nickname,
        lookup_key: price.lookupKey,
        active: price.active,
        tax_behavior: price.taxBehavior,
        recurring: price.recurring ? {
          interval: price.recurring.interval,
          interval_count: price.recurring.intervalCount,
          trial_period_days: price.recurring.trialPeriodDays,
          usage_type: price.recurring.usageType,
          meter: price.recurring.meter,
        } : undefined,
        tiers: price.tiers?.map(tier => ({
          flat_amount: tier.flatAmount,
          flat_amount_decimal: tier.flatAmountDecimal,
          unit_amount: tier.unitAmount,
          unit_amount_decimal: tier.unitAmountDecimal,
          up_to: tier.upTo,
        })),
        tiers_mode: price.tiersMode,
        transform_quantity: price.transformQuantity ? {
          divide_by: price.transformQuantity.divideBy,
          round: price.transformQuantity.round,
        } : undefined,
        currency_options: price.currencyOptions ? Object.fromEntries(
          Object.entries(price.currencyOptions).map(([key, value]) => [
            key,
            {
              unit_amount: value.unitAmount,
              unit_amount_decimal: value.unitAmountDecimal,
              tax_behavior: value.taxBehavior,
            }
          ])
        ) : undefined,
        custom_unit_amount: price.customUnitAmount ? {
          enabled: price.customUnitAmount.enabled,
          maximum: price.customUnitAmount.maximum,
          minimum: price.customUnitAmount.minimum,
          preset: price.customUnitAmount.preset,
        } : undefined,
        metadata: {
          [metadataConfig.priceIdField]: price.id,
          [metadataConfig.productIdField]: context.internalProductId,
          [metadataConfig.managedByField]: metadataConfig.managedByValue,
          plan_name: context.planName,
          tier: context.tier,
          ...price.metadata,
        },
      };
    },
  };
}
