import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './__tests__/test-schema.ts',
  out: './__tests__/test-migrations',
  dbCredentials: {
    url: 'postgresql://postgres_test:postgres_test@localhost:15432/postgres_test',
  },
});
