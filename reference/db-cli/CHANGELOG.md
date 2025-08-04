# Changelog

All notable changes to this project will be documented in this file.

## [0.1.1] - 2025-08-03

- Removed private from package.json
- Updated workflow to publish only this package and not include others

## [0.1.0] - 2025-08-03

### Core Features
- Database connection management with support for PostgreSQL, SQLite, MySQL, Turso, SingleStore, and Gel
- Multi-environment support (dev, test, staging, prod) with automatic config file discovery
- Type-safe configuration with defineConfig helper
- Integration with existing drizzle-kit workflows

### Commands
- **generate** - Generate new migrations from schema changes
- **migrate** - Apply pending migrations to the database
- **studio** - Launch Drizzle Studio web interface
- **push** - Push schema changes directly to database (no migrations)
- **drop** - Drop migrations folder
- **health** - Check database connection and health status with version information
- **seed** - Seed database with initial data using custom seed files
- **truncate** - Truncate database data while preserving table structure
- **reset** - Clear database data (drop all tables and schemas)
- **refresh** - Complete refresh workflow: drop migrations � generate � clear data � migrate

### Table Management
- **list** - List database tables and schemas
- **ls** - Unix-style alias for list command
- Row count support with --count flag for performance insights
- Long format support with -l flag (Unix convention)
- Compact output format with --compact flag for dense display
- Formatted row counts with K/M suffixes for large numbers
- Schema-aware output for PostgreSQL/MySQL with tree structure
- Numbered list format for SQLite databases
- Summary statistics showing total schemas, tables, and row counts

### Configuration & Setup
- Automatic discovery of drizzle config files
- Support for db.config.ts files with seed functionality
- Environment-specific config files (drizzle.config.dev.ts, etc.)
- Configuration validation and error handling
- Custom seed file support with type-safe database connections

### Developer Experience
- Comprehensive CLI help with command descriptions and examples
- Flag validation to prevent incorrect usage
- Colored output for better readability
- Progress indicators and status messages
- Error handling with descriptive messages
- Multi-environment workflow support

### Database Support
- **PostgreSQL** - Fully tested with all drivers (pg, postgres.js, @vercel/postgres, @neondatabase/serverless, pglite, aws-data-api)
- **SQLite** - Fully tested with all drivers (better-sqlite3, @libsql/client, turso, d1-http)
- **MySQL** - Implementation exists (untested)
- **SingleStore** - Implementation exists (untested)
- **Turso** - Implementation exists (untested)
- **Gel** - Implementation exists (untested)