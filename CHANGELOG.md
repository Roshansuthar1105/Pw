# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- **Flyway Database Migration** integrated for version-controlled schema management
  - Added `flyway-core` and `flyway-database-postgresql` dependencies to `backend/build.gradle`
  - Flyway config added to `application.properties` (base), `application-dev.properties`, and `application-prod.properties`
  - Migrations are stored in `db/migration/` folder (shared across services)
  - `V1__create_items_table.sql` — initial migration for the `items` table with indexes
  - `db/README.md` — team guide for migration naming, rules, and workflow

### Changed
- `spring.jpa.hibernate.ddl-auto` changed from `create` / `create-drop` → `validate` across all profiles
  - Flyway now owns schema creation; Hibernate only validates entity-to-table mapping
- Production profile: `spring.flyway.clean-disabled=true` (prevents accidental DB wipes)

### Migration Guide
> **⚠️ For all devs:** After pulling these changes, you must **drop your local `items` table** before starting the app, so Flyway can recreate it via migration:
> ```bash
> psql -U postgres -d setupdb -c "DROP TABLE IF EXISTS items CASCADE;"
> ```
> Then restart the backend: `.\gradlew.bat bootRun`

---

## [0.0.1] - 2026-10-08

### Added
- Initial project setup
- Spring Boot 3.3.4 backend with Java 21
- Angular frontend
- PostgreSQL integration with HikariCP connection pool
- Sample `Item` entity with full CRUD API
- Health check endpoint (`/api/health`)
- Spring Actuator endpoints (health, info, metrics)
- Dev and Prod Spring profiles
- CORS configuration for Angular dev server
- Global exception handler with consistent API response format
- Lombok integration
