import { join } from "node:path";
import { config } from "dotenv";

// Load test environment variables
config({ path: join(__dirname, "../../.env.test") });

// Ensure required environment variables are set
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "Warning: STRIPE_SECRET_KEY not found in environment. Using default test key.",
  );
  process.env.STRIPE_SECRET_KEY =
    "sk_test_51RsRYlIgi56I498Jw3rf0KvQpdp7EwU7KIaZcskASm3pBKWvcTAVSl2WbvW0b9RtiiSUnaJHvQJPgrikcrfqlSAt00b6SOq4gH";
}

if (!process.env.DATABASE_URL) {
  console.warn(
    "Warning: DATABASE_URL not found in environment. Using default.",
  );
  process.env.DATABASE_URL = "file:./test-database.db";
}

// Set test environment
process.env.NODE_ENV = "test";
