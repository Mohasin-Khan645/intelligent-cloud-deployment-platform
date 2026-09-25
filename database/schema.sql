-- Intelligent Cloud Application Deployment and CI/CD Platform
-- Database Schema for PostgreSQL

-- Drop tables if they already exist (in reverse dependency order)
DROP TABLE IF EXISTS deployments CASCADE;
DROP TABLE IF EXISTS environments CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- ============================================================
-- 1. Users Table
-- ============================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for fast lookups during authentication
CREATE INDEX idx_users_email ON users(email);


-- ============================================================
-- 2. Projects Table
-- ============================================================

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    github_repository VARCHAR(255) NOT NULL,
    github_branch VARCHAR(100) DEFAULT 'main',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 3. Deployments Table
-- ============================================================
-- Statuses:
-- QUEUED
-- BUILDING
-- DEPLOYING
-- SUCCESS
-- FAILED
-- ROLLED_BACK

CREATE TABLE deployments (
    id SERIAL PRIMARY KEY,

    -- Project relationship
    project_id INTEGER NOT NULL
        REFERENCES projects(id)
        ON DELETE CASCADE,

    -- Deployment information
    version VARCHAR(50) NOT NULL,
    commit_sha VARCHAR(40) NOT NULL,
    environment VARCHAR(50) NOT NULL DEFAULT 'Production',
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED',

    -- ========================================================
    -- GitHub Actions Deployment Tracking
    -- ========================================================
    github_run_id BIGINT,
    github_run_number INTEGER,
    github_run_url VARCHAR(500),

    -- Deployment timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Error information
    error_message TEXT
);

-- Deployment indexes
CREATE INDEX idx_deployments_project_id
ON deployments(project_id);

CREATE INDEX idx_deployments_status
ON deployments(status);

-- GitHub Actions indexes
CREATE INDEX idx_deployments_github_run_id
ON deployments(github_run_id);

CREATE INDEX idx_deployments_github_run_number
ON deployments(github_run_number);


-- ============================================================
-- 4. Environments Table
-- ============================================================

CREATE TABLE environments (
    id SERIAL PRIMARY KEY,

    project_id INTEGER NOT NULL
        REFERENCES projects(id)
        ON DELETE CASCADE,

    name VARCHAR(50) NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'Healthy',

    current_version VARCHAR(50) DEFAULT 'v1.0.0',

    application_url VARCHAR(255),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_project_environment
        UNIQUE (project_id, name)
);

CREATE INDEX idx_environments_project_id
ON environments(project_id);


-- ============================================================
-- OPTIONAL SEED DATA
-- Demo Application & Realistic DevOps UI
-- ============================================================

-- Password for demo user is 'Password123!'
-- Hashed with bcrypt: 10 rounds

INSERT INTO users (
    name,
    email,
    password_hash
)
VALUES (
    'DevOps Admin',
    'admin@clouddeploy.local',
    '$2a$10$7vN3X/tI3C5L8JgY017Gbe8KqZkF68N3sW6g.c0xZt7bFkJc5l0/G'
)
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- Projects Seed Data
-- ============================================================

INSERT INTO projects (
    id,
    name,
    description,
    github_repository,
    github_branch
)
VALUES
(
    1,
    'Demo Application Service',
    'Core microservice for automated container delivery pipeline',
    'github.com/clouddeploy/demo-app',
    'main'
),
(
    2,
    'Payment Gateway API',
    'PCI-DSS compliant payment processing microservice',
    'github.com/clouddeploy/payment-service',
    'main'
),
(
    3,
    'Authentication Service',
    'Centralized OAuth2 and JWT authentication identity provider',
    'github.com/clouddeploy/auth-service',
    'release/v2'
),
(
    4,
    'Frontend Web Portal',
    'React client dashboard portal with edge CDN caching',
    'github.com/clouddeploy/web-portal',
    'main'
)
ON CONFLICT (id) DO NOTHING;


-- Reset project ID sequence
SELECT setval(
    'projects_id_seq',
    (SELECT MAX(id) FROM projects)
);


-- ============================================================
-- Environments Seed Data
-- ============================================================

INSERT INTO environments (
    project_id,
    name,
    status,
    current_version,
    application_url
)
VALUES
(
    1,
    'Development',
    'Healthy',
    'v1.0.5-alpha',
    'https://dev.demo-app.internal'
),
(
    1,
    'Staging',
    'Healthy',
    'v1.0.4',
    'https://staging.demo-app.internal'
),
(
    1,
    'Production',
    'Healthy',
    'v1.0.4',
    'https://demo-app.clouddeploy.internal'
),
(
    2,
    'Production',
    'Healthy',
    'v2.1.0',
    'https://payment.clouddeploy.internal'
),
(
    3,
    'Production',
    'Healthy',
    'v2.0.3',
    'https://auth.clouddeploy.internal'
),
(
    4,
    'Production',
    'Healthy',
    'v3.2.1',
    'https://app.clouddeploy.internal'
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- Deployments Seed Data
-- ============================================================

INSERT INTO deployments (
    project_id,
    version,
    commit_sha,
    environment,
    status,
    started_at,
    completed_at,
    error_message
)
VALUES
(
    1,
    'v1.0.4',
    'a83f91c',
    'Production',
    'SUCCESS',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 58 minutes',
    NULL
),
(
    1,
    'v1.0.3',
    '7ec281b',
    'Staging',
    'SUCCESS',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '23 hours 58 minutes',
    NULL
),
(
    1,
    'v1.0.2',
    'f49a120',
    'Production',
    'FAILED',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '3 minutes',
    'Build step failed: Docker daemon out of memory'
),
(
    1,
    'v1.0.1',
    'c281e59',
    'Production',
    'ROLLED_BACK',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '5 minutes',
    'Health check timed out after 120s - initiated automated rollback'
),
(
    2,
    'v2.1.0',
    'bb1048a',
    'Production',
    'SUCCESS',
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '4 hours 56 minutes',
    NULL
),
(
    3,
    'v2.0.3',
    '39f82d1',
    'Production',
    'SUCCESS',
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '11 hours 57 minutes',
    NULL
),
(
    4,
    'v3.2.1',
    '90e44ac',
    'Production',
    'SUCCESS',
    NOW() - INTERVAL '18 hours',
    NOW() - INTERVAL '17 hours 55 minutes',
    NULL
);