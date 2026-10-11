-- ============================================================
-- V1__create_items_table.sql
-- Initial schema: creates the 'items' table
-- ============================================================

CREATE TABLE IF NOT EXISTS items (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    description     VARCHAR(1000),
    active          BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP
);

-- Index for frequently queried columns
CREATE INDEX idx_items_active ON items (active);
CREATE INDEX idx_items_name ON items (name);
