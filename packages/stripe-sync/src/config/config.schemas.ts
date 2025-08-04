import { z } from "zod";

import type Stripe from "stripe";

// ========================================================================
// SUBSCRIPTION TYPES & SCHEMAS
// ========================================================================

export const subscriptionPriceSchema = z.object({
	id: z.string(),
	interval: z.enum(["month", "year"]),
	unitAmount: z.number().positive(),
	currency: z.string().length(3),
});

export type SubscriptionPrice = z.infer<typeof subscriptionPriceSchema>;

export const subscriptionPlanSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	features: z.array(z.string()).optional(),
	prices: z.array(subscriptionPriceSchema),
});

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

// ========================================================================
// STRIPE MAPPER TYPES & SCHEMAS
// ========================================================================

export interface StripePriceContext {
	stripeProductId: string;
	internalProductId: string;
	planName: string;
	tier: string;
}

export interface StripeMappers {
	mapSubscriptionPlanToStripeProduct: (
		plan: SubscriptionPlan,
	) => Stripe.ProductCreateParams;
	mapSubscriptionPlanToStripePrice: (
		price: SubscriptionPrice,
		context: StripePriceContext,
	) => Stripe.PriceCreateParams;
}

// ========================================================================
// DATABASE ADAPTER TYPES & SCHEMAS
// ========================================================================

export interface DatabaseAdapter {
	connect(): Promise<void>;
	syncProducts(products: unknown[]): Promise<void>;
	syncPrices(prices: unknown[]): Promise<void>;
	clearProducts(): Promise<void>;
	clearPrices(): Promise<void>;
	getProducts?(): Promise<unknown[]>;
	getPrices?(): Promise<unknown[]>;
}

// Schema for DatabaseAdapter - accepts any object with the required methods
export const databaseAdapterSchema = z.object({
	connect: z.any().transform((t) => t as DatabaseAdapter["connect"]),
	syncProducts: z.any().transform((t) => t as DatabaseAdapter["syncProducts"]),
	syncPrices: z.any().transform((t) => t as DatabaseAdapter["syncPrices"]),
	clearProducts: z
		.any()
		.transform((t) => t as DatabaseAdapter["clearProducts"]),
	clearPrices: z.any().transform((t) => t as DatabaseAdapter["clearPrices"]),
	getProducts: z
		.any()
		.transform((t) => t as DatabaseAdapter["getProducts"])
		.optional(),
	getPrices: z
		.any()
		.transform((t) => t as DatabaseAdapter["getPrices"])
		.optional(),
});

// ========================================================================
// STRIPE SYNC CONFIGURATION TYPES & SCHEMAS
// ========================================================================

export const stripeSyncConfigSchema = z.object({
	plans: z.array(subscriptionPlanSchema),
	envFiles: z.object({
		test: z.string(),
		dev: z.string(),
		prod: z.string(),
	}),
	env: z.object({
		stripeSecretKey: z.string(),
	}),
	adapter: databaseAdapterSchema,
	productIds: z.record(z.string(), z.string()).optional(),
});

export type StripeSyncConfig = Omit<
	z.infer<typeof stripeSyncConfigSchema>,
	"adapter"
> & {
	adapter: DatabaseAdapter;
};
