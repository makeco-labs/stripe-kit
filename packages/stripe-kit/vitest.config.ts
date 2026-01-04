/// <reference types="vitest" />

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: ["./src/**/*.spec.ts", "./src/**/*.test.ts"],
    setupFiles: ["./src/test-utils/setup.ts"],
    globals: true,
    environment: "node",
    // Run tests sequentially to avoid Stripe API race conditions
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Retry flaky tests (Stripe API can have intermittent issues)
    retry: 2,
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/test-utils/**",
        "**/node_modules/**",
        "**/dist/**",
      ],
      clean: true,
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
