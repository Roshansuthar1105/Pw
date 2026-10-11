-- ============================================================
-- V2__rbac_access_control.sql
-- RBAC Access Control: Users, Groups, Roles, Components & Audit
-- ============================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id                  BIGSERIAL       PRIMARY KEY,
    username            VARCHAR(100)    NOT NULL UNIQUE,
    email               VARCHAR(255)    NOT NULL UNIQUE,
    password_hash       VARCHAR(255)    NOT NULL,
    user_type           VARCHAR(50)     NOT NULL CHECK (user_type IN ('STUDENT', 'TEACHER', 'MENTOR', 'ADMIN')),
    is_super_admin      BOOLEAN         NOT NULL DEFAULT FALSE,
    active              BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP
);

CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_user_type ON users (user_type);
CREATE INDEX idx_users_is_super_admin ON users (is_super_admin);

-- 2. Groups Table
CREATE TABLE IF NOT EXISTS groups (
    id                      BIGSERIAL       PRIMARY KEY,
    name                    VARCHAR(150)    NOT NULL UNIQUE,
    code                    VARCHAR(100)    NOT NULL UNIQUE,
    description             VARCHAR(500),
    is_system               BOOLEAN         NOT NULL DEFAULT FALSE,
    is_default              BOOLEAN         NOT NULL DEFAULT FALSE,
    default_for_user_type   VARCHAR(50)     CHECK (default_for_user_type IN ('STUDENT', 'TEACHER', 'MENTOR', 'ADMIN') OR default_for_user_type IS NULL),
    created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP
);

CREATE INDEX idx_groups_code ON groups (code);
CREATE INDEX idx_groups_is_default ON groups (is_default);
CREATE INDEX idx_groups_default_user_type ON groups (default_for_user_type);

-- 3. User-Groups Membership (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_groups (
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id    BIGINT      NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, group_id)
);

CREATE INDEX idx_user_groups_user ON user_groups (user_id);
CREATE INDEX idx_user_groups_group ON user_groups (group_id);

-- 4. Components Table (3-Level Hierarchy: MENU -> SUBMENU -> FUNCTIONALITY)
CREATE TABLE IF NOT EXISTS components (
    id              BIGSERIAL       PRIMARY KEY,
    level           VARCHAR(20)     NOT NULL CHECK (level IN ('MENU', 'SUBMENU', 'FUNCTIONALITY')),
    parent_id       BIGINT          REFERENCES components(id) ON DELETE CASCADE,
    code            VARCHAR(100)    NOT NULL UNIQUE,
    name            VARCHAR(150)    NOT NULL,
    icon            VARCHAR(100),
    route           VARCHAR(255),
    help_text       VARCHAR(500),
    element_type    VARCHAR(50),
    sort_order      INT             NOT NULL DEFAULT 0,
    active          BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP,
    CONSTRAINT chk_component_level_hierarchy CHECK (
        (level = 'MENU' AND parent_id IS NULL) OR
        (level IN ('SUBMENU', 'FUNCTIONALITY') AND parent_id IS NOT NULL)
    )
);

CREATE INDEX idx_components_level ON components (level);
CREATE INDEX idx_components_parent ON components (parent_id);
CREATE INDEX idx_components_code ON components (code);
CREATE INDEX idx_components_active ON components (active);

-- 5. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(150)    NOT NULL UNIQUE,
    code            VARCHAR(100)    NOT NULL UNIQUE,
    description     VARCHAR(500),
    is_system       BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP
);

CREATE INDEX idx_roles_code ON roles (code);

-- 6. Role-Components Assignment (Many-to-Many)
CREATE TABLE IF NOT EXISTS role_components (
    role_id         BIGINT      NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    component_id    BIGINT      NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    assigned_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, component_id)
);

CREATE INDEX idx_role_components_role ON role_components (role_id);
CREATE INDEX idx_role_components_comp ON role_components (component_id);

-- 7. Group-Roles Assignment (Many-to-Many)
CREATE TABLE IF NOT EXISTS group_roles (
    group_id    BIGINT      NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    role_id     BIGINT      NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, role_id)
);

CREATE INDEX idx_group_roles_group ON group_roles (group_id);
CREATE INDEX idx_group_roles_role ON group_roles (role_id);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id              BIGSERIAL       PRIMARY KEY,
    actor_id        BIGINT          REFERENCES users(id) ON DELETE SET NULL,
    actor_username  VARCHAR(100),
    action          VARCHAR(50)     NOT NULL, -- CREATE, UPDATE, DELETE, ASSIGN, UNASSIGN
    entity_type     VARCHAR(50)     NOT NULL, -- COMPONENT, ROLE, GROUP, USER
    entity_id       VARCHAR(100),
    entity_name     VARCHAR(200),
    details         TEXT,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- ============================================================
-- Seed Data: Protected System Default Groups & Initial Users
-- ============================================================

-- 4 System Default Groups (Protected, cannot be deleted or renamed)
INSERT INTO groups (name, code, description, is_system, is_default, default_for_user_type) VALUES
('Default Students', 'GRP_DEFAULT_STUDENTS', 'Default system container for all student accounts', TRUE, TRUE, 'STUDENT'),
('Default Teachers', 'GRP_DEFAULT_TEACHERS', 'Default system container for all teacher accounts', TRUE, TRUE, 'TEACHER'),
('Default Mentors',  'GRP_DEFAULT_MENTORS',  'Default system container for all mentor accounts',  TRUE, TRUE, 'MENTOR'),
('Default Admins',   'GRP_DEFAULT_ADMINS',   'Default system container for all admin accounts',   TRUE, TRUE, 'ADMIN')
ON CONFLICT (code) DO NOTHING;

-- Initial Users (Password: Admin@123 / hashed with BCrypt $2a$10$wK1/...)
-- BCrypt for 'Admin@123': $2a$10$K9b0fV7uC6tG2fUvF/8Bce7uY1N9t6u7gW9Xyq2zV4a0nKzQ6k4jS
INSERT INTO users (username, email, password_hash, user_type, is_super_admin, active) VALUES
('superadmin', 'superadmin@medhaa.edu', '$2a$10$K9b0fV7uC6tG2fUvF/8Bce7uY1N9t6u7gW9Xyq2zV4a0nKzQ6k4jS', 'ADMIN', TRUE, TRUE),
('admin_user', 'admin@medhaa.edu',      '$2a$10$K9b0fV7uC6tG2fUvF/8Bce7uY1N9t6u7gW9Xyq2zV4a0nKzQ6k4jS', 'ADMIN', FALSE, TRUE),
('teacher_demo','teacher@medhaa.edu',   '$2a$10$K9b0fV7uC6tG2fUvF/8Bce7uY1N9t6u7gW9Xyq2zV4a0nKzQ6k4jS', 'TEACHER', FALSE, TRUE),
('mentor_demo', 'mentor@medhaa.edu',    '$2a$10$K9b0fV7uC6tG2fUvF/8Bce7uY1N9t6u7gW9Xyq2zV4a0nKzQ6k4jS', 'MENTOR', FALSE, TRUE),
('student_demo','student@medhaa.edu',   '$2a$10$K9b0fV7uC6tG2fUvF/8Bce7uY1N9t6u7gW9Xyq2zV4a0nKzQ6k4jS', 'STUDENT', FALSE, TRUE)
ON CONFLICT (username) DO NOTHING;

-- Link Initial Users to their respective Default Groups
INSERT INTO user_groups (user_id, group_id)
SELECT u.id, g.id FROM users u
JOIN groups g ON (
    (u.username = 'superadmin' AND g.code = 'GRP_DEFAULT_ADMINS') OR
    (u.username = 'admin_user' AND g.code = 'GRP_DEFAULT_ADMINS') OR
    (u.username = 'teacher_demo' AND g.code = 'GRP_DEFAULT_TEACHERS') OR
    (u.username = 'mentor_demo' AND g.code = 'GRP_DEFAULT_MENTORS') OR
    (u.username = 'student_demo' AND g.code = 'GRP_DEFAULT_STUDENTS')
)
ON CONFLICT DO NOTHING;
