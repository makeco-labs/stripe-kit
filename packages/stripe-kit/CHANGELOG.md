# Changelog

All notable changes to this project will be documented in this file.

## [0.1.1] - 2025-08-07

### Changed
- **README:** Completely restructured README with concise command listing format
- **README:** Added experimental status warning at the top
- **README:** Streamlined documentation to match modern CLI tool standards
- **README:** Added key features section with emojis for better readability
- **README:** Consolidated all commands into single help-style block with descriptions

### Improved
- Documentation clarity and user experience
- Quick reference format for CLI commands
- Professional presentation aligned with industry standards

## [0.1.0] - 2025-08-05

### Added
- Initial release of @makeco/stripe-kit CLI
- Core subscription plan management (create, archive, update, sync)
- Database synchronization with adapter pattern
- Multi-environment support (test, dev, staging, prod)
- User preferences storage and persistence
- Interactive CLI prompts with validation

### Changed
- **BREAKING:** Package renamed from `stripe-kit` to `@makeco/stripe-kit` for legal clarity
- **BREAKING:** Commands restructured to use subcommand pattern:
  - `clear-db-plans` � `stripe-kit db purge`
  - `list-products` � `stripe-kit list products`
  - `list-prices` � `stripe-kit list prices`
- Modernized CLI output styling (removed emojis, clean professional appearance)
- Improved command help display with proper exit codes
- Updated configuration file references to use @makeco namespace

### Fixed
- Resolved escaped newlines showing as `\n` in CLI output
- Fixed hanging commands after completion by adding proper `process.exit(0)` calls
- Corrected TypeScript build errors (TS2774, TS2322)
- Fixed function type checking and boolean assignments
- Removed circular dependencies and improved module structure

### Technical
- Migrated to Commander.js subcommand architecture
- Implemented proper process exit handling
- Enhanced error handling and validation
- Improved folder structure for maintainability
- Added comprehensive TypeScript types and schemas