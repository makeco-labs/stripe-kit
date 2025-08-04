# @makeco/db-cli

> ⚠️ **Experimental Package**
>
> This package is currently in development and should be considered experimental. Only postgres and sqlite are tested. The API may change at any time.

A powerful database CLI tool that extends drizzle-kit with additional commands for database management workflows. Simplify your database operations with powerful commands like `reset` which drops all schemas/tables and `refresh` which drops migrations → generates migrations → resets db schemas/tables → migrate schemas .

[![npm version](https://badge.fury.io/js/@makeco%2Fdb-cli.svg)](https://badge.fury.io/js/@makeco%2Fdb-cli)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @makeco/db-cli drizzle-kit
yarn add @makeco/db-cli drizzle-kit
bun add @makeco/db-cli drizzle-kit
```

## Quick Start

1. Define a `db.config.ts` file in your project.

```ts
import { defineConfig } from "@makeco/db-cli";

export default defineConfig({
	drizzleConfig: "./drizzle.config.ts",
	seed: "./src/libs/db/seed.ts",
});
```

2. Add a `db` script to your package.json scripts with the config flag:

```json
{
	"scripts": {
		"db": "bunx @makeco/db-cli -c ./db.config.ts"
	}
}
```

Then run commands with:

```bash
bun db generate
bun db migrate
bun db seed
bun db list --count
```

### Commands

```bash
  drop          # Drop migrations folder (drizzle-kit default behavior)
  generate      # Generate new migrations from schema changes
  migrate       # Apply pending migrations to the database
  studio        # Launch Drizzle Studio web interface
  push          # Push schema changes directly to database (no migrations)
  health        # Check database connection and health status
  ls            # List database tables and schemas (alias for list)
  seed          # Seed database with initial data (requires seed path in db.config.ts)
  truncate      # Truncate database data while preserving table structure
  reset         # Clear database data (drop all tables and schemas)
  refresh       # Complete refresh: drop migrations → generate → clear data → migrate
```

## Database Support Status

| Database    | Status      | Notes                                           |
| ----------- | ----------- | ----------------------------------------------- |
| PostgreSQL  | ✅ Tested   | Fully tested and working                        |
| SQLite      | ✅ Tested   | Fully tested and working                        |
| MySQL       | ⚠️ Untested | Implementation exists but not officially tested |
| Turso       | ⚠️ Untested | Implementation exists but not officially tested |
| SingleStore | ⚠️ Untested | Implementation exists but not officially tested |
| Gel         | ⚠️ Untested | Implementation exists but not officially tested |

## Use Cases

### Database Seeding

Set up initial data for development or testing.

Note: Your seed file should export a default function.

```typescript
// src/db/seed.ts
import { db } from "./connection";
import { users, posts } from "./schema";

export default async function seed() {
	console.log("🌱 Seeding PostgreSQL database...");

	// Create database connection
	const pool = new Pool({
		connectionString: process.env.DATABASE_URL!,
	});

	const db = drizzle(pool, {
		schema: { users, posts, comments },
	});

	// Clear existing data (optional)
	await connection.delete(posts);
	await connection.delete(users);

	// Insert initial users
	const [user1, user2] = await connection
		.insert(users)
		.values([
			{ name: "John Doe", email: "john@example.com" },
			{ name: "Jane Smith", email: "jane@example.com" },
		])
		.returning();

	// Insert initial posts
	await connection.insert(posts).values([
		{
			title: "Welcome Post",
			content: "Welcome to our platform!",
			authorId: user1.id,
		},
		{
			title: "Getting Started",
			content: "Here's how to get started...",
			authorId: user2.id,
		},
	]);

	console.log(`✅ Inserted ${insertedComments.length} comments`);
	console.log("🎉 Database seeding completed successfully!");

	// Close database connection
	await pool.end();
}
```

## License

MIT © [@makeco](https://github.com/makeco-labs)
