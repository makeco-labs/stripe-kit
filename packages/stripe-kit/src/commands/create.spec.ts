import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cli, getTestStripeKey } from "@/test-utils";

describe("stripe-kit create", () => {
  let configPath: string;

  beforeEach(() => {
    configPath = cli.createTempConfig({
      plans: [
        {
          id: "test-create",
          product: { name: "Test Create", type: "service" },
          prices: [
            {
              id: "test-create-price",
              currency: "usd",
              unit_amount: 999,
              recurring: { interval: "month" },
            },
          ],
        },
      ],
      env: { stripeSecretKey: getTestStripeKey() },
      adapters: {},
      metadata: { managedByValue: "@makeco/stripe-kit-create-test" },
    });
  });

  afterEach(() => {
    cli.cleanupTempConfig(configPath);
  });

  it("creates products in Stripe", () => {
    const result = cli.create({ env: "test", config: configPath });
    expect(result.success).toBe(true);
    // Product may already exist (found) or be newly created
    expect(result.stdout).toMatch(/created|found/);
  });

  it("handles missing config", () => {
    const result = cli.create({ env: "test", config: "/invalid/path" });
    expect(result.success).toBe(false);
  });
});
