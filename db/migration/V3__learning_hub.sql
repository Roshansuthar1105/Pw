-- Learning Hub: course taxonomy, questions, resources, tests, and attempts.

CREATE TABLE courses (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(180) NOT NULL UNIQUE,
    description VARCHAR(1000),
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP
);

CREATE TABLE subjects (
    id          BIGSERIAL PRIMARY KEY,
    course_id   BIGINT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    name        VARCHAR(180) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    CONSTRAINT uq_subject_course_name UNIQUE(course_id, name)
);

CREATE TABLE topics (
    id          BIGSERIAL PRIMARY KEY,
    subject_id  BIGINT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    name        VARCHAR(180) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    CONSTRAINT uq_topic_subject_name UNIQUE(subject_id, name)
);

CREATE TABLE questions (
    id              BIGSERIAL PRIMARY KEY,
    course_id       BIGINT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    subject_id      BIGINT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    topic_id        BIGINT REFERENCES topics(id) ON DELETE RESTRICT,
    prompt          TEXT NOT NULL,
    image_url       VARCHAR(1500),
    explanation     TEXT,
    correct_option VARCHAR(1) NOT NULL CHECK (correct_option IN ('A','B','C','D','E','F')),
    marks           INTEGER NOT NULL DEFAULT 1 CHECK (marks > 0),
    difficulty      VARCHAR(16) NOT NULL CHECK (difficulty IN ('EASY','MEDIUM','HARD')),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP
);
CREATE INDEX idx_questions_taxonomy ON questions(course_id, subject_id, topic_id);
CREATE INDEX idx_questions_active ON questions(active);

CREATE TABLE question_options (
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_key  VARCHAR(1) NOT NULL CHECK (option_key IN ('A','B','C','D','E','F')),
    content     TEXT NOT NULL,
    position    INTEGER NOT NULL,
    PRIMARY KEY(question_id, option_key),
    CONSTRAINT uq_question_option_position UNIQUE(question_id, position)
);

CREATE TABLE learning_resources (
    id          BIGSERIAL PRIMARY KEY,
    course_id   BIGINT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    subject_id  BIGINT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    topic_id    BIGINT REFERENCES topics(id) ON DELETE RESTRICT,
    type        VARCHAR(16) NOT NULL CHECK (type IN ('NOTES','VIDEO')),
    title       VARCHAR(240) NOT NULL,
    description VARCHAR(1500),
    url         VARCHAR(1500) NOT NULL,
    published   BOOLEAN NOT NULL DEFAULT TRUE,
    created_by  BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP
);
CREATE INDEX idx_learning_resources_taxonomy ON learning_resources(course_id, subject_id, topic_id);
CREATE INDEX idx_learning_resources_public ON learning_resources(published, type);

CREATE TABLE learning_tests (
    id              BIGSERIAL PRIMARY KEY,
    course_id       BIGINT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    subject_id      BIGINT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    title           VARCHAR(240) NOT NULL,
    instructions    VARCHAR(2000),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 600),
    available_from  TIMESTAMP,
    available_until TIMESTAMP,
    published       BOOLEAN NOT NULL DEFAULT FALSE,
    created_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP,
    CONSTRAINT chk_test_availability CHECK (available_until IS NULL OR available_from IS NULL OR available_until > available_from)
);
CREATE INDEX idx_learning_tests_public ON learning_tests(published, available_from, available_until);

CREATE TABLE test_questions (
    test_id     BIGINT NOT NULL REFERENCES learning_tests(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    question_order INTEGER NOT NULL,
    PRIMARY KEY(test_id, question_id),
    CONSTRAINT uq_test_question_order UNIQUE(test_id, question_order)
);

CREATE TABLE test_attempts (
    id           BIGSERIAL PRIMARY KEY,
    test_id      BIGINT NOT NULL REFERENCES learning_tests(id) ON DELETE RESTRICT,
    student_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status       VARCHAR(16) NOT NULL CHECK (status IN ('IN_PROGRESS','SUBMITTED')),
    started_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    score        INTEGER,
    CONSTRAINT uq_test_attempt_student UNIQUE(test_id, student_id)
);
CREATE INDEX idx_test_attempt_student ON test_attempts(student_id, started_at DESC);

CREATE TABLE test_attempt_answers (
    attempt_id   BIGINT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_id  BIGINT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    selected_option VARCHAR(1) CHECK (selected_option IS NULL OR selected_option IN ('A','B','C','D','E','F')),
    PRIMARY KEY(attempt_id, question_id)
);

-- Navigation entries and granular permissions. Seed base feature access for
-- the default admin and student groups while leaving role assignments editable.
INSERT INTO components (level, code, name, icon, sort_order, active)
VALUES ('MENU', 'MENU_LEARNING', 'Learning', 'book-open', 2, TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO components (level, parent_id, code, name, route, help_text, sort_order, active)
SELECT 'SUBMENU', m.id, 'SUBMENU_LEARNING_HUB', 'Learning Hub', '/learning', 'Manage and browse course materials and questions', 1, TRUE
FROM components m WHERE m.code = 'MENU_LEARNING'
ON CONFLICT (code) DO NOTHING;

INSERT INTO components (level, parent_id, code, name, route, help_text, sort_order, active)
SELECT 'SUBMENU', m.id, 'SUBMENU_LEARNING_TESTS', 'Tests', '/tests', 'Build, publish, and take tests', 2, TRUE
FROM components m WHERE m.code = 'MENU_LEARNING'
ON CONFLICT (code) DO NOTHING;

INSERT INTO components (level, parent_id, code, name, element_type, sort_order, active)
SELECT 'FUNCTIONALITY', s.id, f.code, f.name, 'BUTTON', f.position, TRUE
FROM components s
CROSS JOIN (VALUES
  ('FN_RESOURCES_VIEW', 'View learning resources', 1),
  ('FN_RESOURCES_CREATE', 'Create learning resources', 2),
  ('FN_RESOURCES_EDIT', 'Edit learning resources', 3),
  ('FN_RESOURCES_DELETE', 'Delete learning resources', 4),
  ('FN_QUESTIONS_VIEW', 'View question bank', 5),
  ('FN_QUESTIONS_CREATE', 'Create questions', 6),
  ('FN_QUESTIONS_EDIT', 'Edit questions', 7),
  ('FN_QUESTIONS_DELETE', 'Delete questions', 8),
  ('FN_QUESTIONS_IMPORT', 'Import questions', 9),
  ('FN_TAXONOMY_VIEW', 'View course taxonomy', 10),
  ('FN_TAXONOMY_MANAGE', 'Manage course taxonomy', 11)
) AS f(code, name, position)
WHERE s.code = 'SUBMENU_LEARNING_HUB'
ON CONFLICT (code) DO NOTHING;

INSERT INTO components (level, parent_id, code, name, element_type, sort_order, active)
SELECT 'FUNCTIONALITY', s.id, f.code, f.name, 'BUTTON', f.position, TRUE
FROM components s
CROSS JOIN (VALUES
  ('FN_TESTS_VIEW', 'View published tests', 1),
  ('FN_TESTS_CREATE', 'Create tests', 2),
  ('FN_TESTS_EDIT', 'Edit tests', 3),
  ('FN_TESTS_PUBLISH', 'Publish tests', 4),
  ('FN_TESTS_ATTEMPT', 'Attempt tests', 5),
  ('FN_TESTS_DELETE', 'Delete tests', 6)
) AS f(code, name, position)
WHERE s.code = 'SUBMENU_LEARNING_TESTS'
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (name, code, description, is_system)
VALUES
  ('Learning Administrator', 'ROLE_LEARNING_ADMIN', 'Manage learning content, questions, taxonomy, and tests', TRUE),
  ('Learning Student', 'ROLE_LEARNING_STUDENT', 'View learning materials and take published tests', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_components(role_id, component_id)
SELECT r.id, c.id
FROM roles r CROSS JOIN components c
WHERE r.code = 'ROLE_LEARNING_ADMIN'
  AND c.code IN (
    'MENU_LEARNING','SUBMENU_LEARNING_HUB','SUBMENU_LEARNING_TESTS',
    'FN_RESOURCES_VIEW','FN_RESOURCES_CREATE','FN_RESOURCES_EDIT','FN_RESOURCES_DELETE',
    'FN_QUESTIONS_VIEW','FN_QUESTIONS_CREATE','FN_QUESTIONS_EDIT','FN_QUESTIONS_DELETE','FN_QUESTIONS_IMPORT',
    'FN_TAXONOMY_VIEW','FN_TAXONOMY_MANAGE',
    'FN_TESTS_VIEW','FN_TESTS_CREATE','FN_TESTS_EDIT','FN_TESTS_PUBLISH','FN_TESTS_ATTEMPT','FN_TESTS_DELETE'
  )
ON CONFLICT DO NOTHING;

INSERT INTO role_components(role_id, component_id)
SELECT r.id, c.id
FROM roles r CROSS JOIN components c
WHERE r.code = 'ROLE_LEARNING_STUDENT'
  AND c.code IN ('MENU_LEARNING','SUBMENU_LEARNING_HUB','SUBMENU_LEARNING_TESTS','FN_RESOURCES_VIEW','FN_TESTS_VIEW','FN_TESTS_ATTEMPT')
ON CONFLICT DO NOTHING;

INSERT INTO group_roles(group_id, role_id)
SELECT g.id, r.id
FROM groups g CROSS JOIN roles r
WHERE (g.code = 'GRP_DEFAULT_ADMINS' AND r.code = 'ROLE_LEARNING_ADMIN')
   OR (g.code = 'GRP_DEFAULT_STUDENTS' AND r.code = 'ROLE_LEARNING_STUDENT')
ON CONFLICT DO NOTHING;
