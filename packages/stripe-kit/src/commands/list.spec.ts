import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cli, getTestStripeKey } from "@/test-utils";

describe("stripe-kit list products", () => {
  let configPath: string;

  beforeEach(() => {
    configPath = cli.createTempConfig({
      plans: [
        {
          id: "list-test",
          product: {
            name: "List Test Product",
            type: "service",
          },
          prices: [
            {
              id: "list-test-price",
              currency: "usd",
              unit_amount: 999,
              recurring: { interval: "month" },
            },
          ],
        },
      ],
      env: { stripeSecretKey: getTestStripeKey() },
      adapters: {},
      metadata: { managedByValue: "@makeco/stripe-kit-list-test" },
    });

    // Ensure products exist
    cli.create({ env: "test", config: configPath });
  });

  afterEach(() => {
    cli.cleanupTempConfig(configPath);
  });

  it("lists products", () => {
    const result = cli.listProducts({ env: "test", config: configPath });
    expect(result.success).toBe(true);
  });

  it("shows all products with --all flag", () => {
    const result = cli.listProducts({
      env: "test",
      all: true,
      config: configPath,
    });
    expect(result.success).toBe(true);
  });
});

describe("stripe-kit list prices", () => {
  let configPath: string;

  beforeEach(() => {
    configPath = cli.createTempConfig({
      plans: [
        {
          id: "price-list-test",
          product: {
            name: "Price List Test",
            type: "service",
          },
          prices: [
            {
              id: "price-list-test-price",
              currency: "usd",
              unit_amount: 1999,
              recurring: { interval: "month" },
            },
          ],
        },
      ],
      env: { stripeSecretKey: getTestStripeKey() },
      adapters: {},
      metadata: { managedByValue: "@makeco/stripe-kit-price-list-test" },
    });

    // Ensure prices exist
    cli.create({ env: "test", config: configPath });
  });

  afterEach(() => {
    cli.cleanupTempConfig(configPath);
  });

  it("lists prices", () => {
    const result = cli.listPrices({ env: "test", config: configPath });
    expect(result.success).toBe(true);
  });

  it("shows all prices with --all flag", () => {
    const result = cli.listPrices({
      env: "test",
      all: true,
      config: configPath,
    });
    expect(result.success).toBe(true);
  });
});
