# ============================================================
# Database Migrations - README
# ============================================================

## Overview

This folder contains all **Flyway database migrations** for the project.
Migrations are version-controlled SQL scripts that track every schema change.

## Folder Structure

```
db/
├── migration/                  # All Flyway SQL migration files
│   ├── V1__create_items_table.sql
│   ├── V2__add_xyz_column.sql   (example)
│   └── ...
└── README.md
```

## Naming Convention

Flyway enforces a strict naming pattern:

```
V{version}__{description}.sql
```

| Part          | Rule                                      | Example              |
|---------------|-------------------------------------------|----------------------|
| `V`           | Prefix (always uppercase V)               | `V`                  |
| `{version}`   | Integer version number                    | `1`, `2`, `3`        |
| `__`          | Double underscore separator               | `__`                 |
| `{description}` | Snake_case description of the change   | `create_items_table` |
| `.sql`        | File extension                            | `.sql`               |

### Examples

```
V1__create_items_table.sql
V2__add_email_to_items.sql
V3__create_users_table.sql
V4__add_foreign_key_items_users.sql
```

## Rules for Developers

### ✅ DO

1. **Always create a new migration** for any schema change (new table, column, index, etc.)
2. **Use the next sequential version number** — check the latest `V{N}__` file and use `V{N+1}__`
3. **Test your migration locally** before pushing
4. **Write idempotent SQL** where possible (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`)
5. **Include both up logic** — Flyway free doesn't support undo, so be careful

### ❌ DON'T

1. **Never modify an existing migration** that has already been applied — Flyway checksums will fail
2. **Never delete a migration file** — it breaks the version history
3. **Never skip version numbers** — use sequential integers
4. **Never use `ddl-auto=update/create`** in production — Flyway handles it

## How Migrations Run

- **Automatically on app startup** — Spring Boot + Flyway runs pending migrations before the app starts
- Flyway tracks applied migrations in the `flyway_schema_history` table
- Only **new/unapplied** migrations run — already applied ones are skipped

## Handling Merge Conflicts

If two devs create migrations with the same version number:

1. The **second dev** must rename their file to the next available version
2. Example: Both created `V3__` → one dev renames theirs to `V4__`
3. Communicate in your team channel when creating migrations

## Useful Commands (via Gradle)

```bash
# Run pending migrations
./gradlew flywayMigrate

# Check migration status
./gradlew flywayInfo

# Validate applied migrations
./gradlew flywayValidate

# Repair broken checksums (use carefully)
./gradlew flywayRepair
```
