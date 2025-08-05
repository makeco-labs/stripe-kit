CREATE TABLE "prices" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_id" text,
	"product_id" text,
	"stripe_product_id" text,
	"currency" text NOT NULL,
	"unit_amount" integer,
	"interval" text,
	"interval_count" integer DEFAULT 1,
	"nickname" text,
	"active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "prices_stripe_id_unique" UNIQUE("stripe_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_id" text,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true,
	"type" text DEFAULT 'service',
	"features" jsonb,
	"marketing_features" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_stripe_id_unique" UNIQUE("stripe_id")
);
--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;