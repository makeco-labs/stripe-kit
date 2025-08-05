import type { SubscriptionPlan } from "@/schemas";
import type { Context } from "@/types";
import { findStripeProduct, findStripePrice } from "./stripe-repository";

// ------------------ ENSURE STRIPE SUBSCRIPTION PLANS ------------------
export async function ensureStripeSubscriptionPlans(
	ctx: Context,
	input: { plans: SubscriptionPlan[] },
): Promise<void> {
	const { plans } = input;
	ctx.logger.info("Ensuring Stripe subscription plans exist...");

	for (const plan of plans) {
		ctx.logger.info(
			`Processing plan: ${plan.product.name} (Internal ID: ${plan.product.id})...`,
		);
		try {
			// 1. Ensure Product Exists
			let stripeProduct = await findStripeProduct(ctx, {
				internalProductId: plan.product.id,
			});
			if (stripeProduct) {
				ctx.logger.info(
					`  Product found: ${stripeProduct.name} (ID: ${stripeProduct.id})`,
				);
			} else {
				ctx.logger.info("  Product not found in Stripe, creating...");
				const stripeProductParams =
					ctx.mappers.mapSubscriptionPlanToStripeProduct(plan);
				stripeProduct =
					await ctx.stripeClient.products.create(stripeProductParams);
				ctx.logger.info(
					`  Created product: ${stripeProduct?.name} (ID: ${stripeProduct?.id})`,
				);
			}

			// 2. Ensure Prices Exist
			for (const price of plan.prices) {
				let stripePrice = await findStripePrice(ctx, {
					internalPriceId: price.id,
					stripeProductId: stripeProduct.id,
				});
				if (stripePrice) {
					ctx.logger.info(
						`    Price ${price.recurring?.interval}ly found: ID ${stripePrice?.id}`,
					);
				} else {
					ctx.logger.info(
						`    Price ${price.recurring?.interval}ly (Internal ID: ${price.id}) not found, creating...`,
					);
					const stripePriceParams =
						ctx.mappers.mapSubscriptionPlanToStripePrice(price, {
							planName: plan.product.name,
							tier: plan.product.id,
							internalProductId: plan.product.id,
							stripeProductId: stripeProduct.id,
						});
					stripePrice = await ctx.stripeClient.prices.create(stripePriceParams);
					ctx.logger.info(
						`    Created price: ID ${stripePrice?.id} @ $${price.unitAmount ? price.unitAmount / 100 : 'variable'}`,
					);
				}
			}
		} catch (error) {
			ctx.logger.error({
				message: "Error ensuring subscription plan/prices in Stripe",
				error,
				metadata: { planId: plan.product.id, planName: plan.product.name },
			});
			throw error;
		}
	}
	ctx.logger.info("Finished ensuring Stripe subscription plans.");
}
