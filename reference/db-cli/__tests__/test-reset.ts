#!/usr/bin/env tsx

import { execSync } from 'node:child_process';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Test database connection
const client = postgres(
  'postgresql://postgres_test:postgres_test@localhost:15432/postgres_test'
);
const db = drizzle(client);

async function setupTestData() {
  console.log('🏗️  Setting up test data...');

  // Create test tables with data
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS test_users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS test_posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      user_id INTEGER REFERENCES test_users(id)
    )
  `);

  // Insert test data
  await db.execute(
    sql`INSERT INTO test_users (name, email) VALUES ('John Doe', 'john@example.com')`
  );
  await db.execute(
    sql`INSERT INTO test_users (name, email) VALUES ('Jane Smith', 'jane@example.com')`
  );
  await db.execute(
    sql`INSERT INTO test_posts (title, content, user_id) VALUES ('First Post', 'Hello World', 1)`
  );
  await db.execute(
    sql`INSERT INTO test_posts (title, content, user_id) VALUES ('Second Post', 'Another post', 2)`
  );

  console.log('✅ Test data created');
}

async function verifyTestData() {
  console.log('🔍 Verifying test data exists...');

  const users = await db.execute(sql`SELECT COUNT(*) as count FROM test_users`);
  const posts = await db.execute(sql`SELECT COUNT(*) as count FROM test_posts`);

  console.log(`   Users: ${users[0].count} records`);
  console.log(`   Posts: ${posts[0].count} records`);

  if (users[0].count === '0' || posts[0].count === '0') {
    throw new Error('❌ Test data not found!');
  }

  console.log('✅ Test data verified');
}

function runReset() {
  console.log('🗑️  Running drizzle-kit-alt reset...');

  try {
    // Test just the reset command without migrate step
    const output = execSync(
      'node ./dist/db-cli.js check --config=__tests__/test.config.ts --env=test',
      {
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );
    console.log('Reset output:', output);
    console.log('✅ Reset command completed');
  } catch (error: unknown) {
    console.error(
      '❌ Reset command failed:',
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

async function verifyReset() {
  console.log('🔍 Verifying reset worked...');

  // Check if user tables are gone
  const userTables = await db.execute(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'drizzle%'
      AND table_name NOT LIKE '%migrations%'
  `);

  console.log(
    'Remaining user tables:',
    userTables.map((t) => t.table_name)
  );

  // Verify migration tables still exist
  const migrationTables = await db.execute(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND (table_name LIKE 'drizzle%' OR table_name LIKE '%migrations%')
  `);

  console.log(
    'Migration tables:',
    migrationTables.map((t) => t.table_name)
  );

  if (userTables.length > 0) {
    throw new Error(
      `❌ Reset failed! User tables still exist: ${userTables.map((t) => t.table_name).join(', ')}`
    );
  }

  console.log('✅ Reset verification passed - all user data cleared!');
}

async function runTest() {
  try {
    console.log('🧪 Starting drizzle-kit-alt reset test\n');

    await setupTestData();
    await verifyTestData();
    await runReset();
    await verifyReset();

    console.log('\n🎉 All tests passed! Reset functionality works correctly.');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the test
runTest();
