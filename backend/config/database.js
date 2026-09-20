const { Pool } = require('pg');
const logger = require('../utils/logger');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/deployment_platform';

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 10000,
  max: 20
});

let isPgConnected = false;

// Test initial connection
pool.connect((err, client, release) => {
  if (err) {
    logger.warn(`PostgreSQL connection notice: ${err.message}`);
    logger.warn('If PostgreSQL is not running, please start PostgreSQL or use Docker: "docker compose up -d"');
  } else {
    isPgConnected = true;
    logger.info('Connected successfully to PostgreSQL database');
    release();
  }
});

// Fallback in-memory storage if PostgreSQL service is offline
const memoryStore = {
  users: [
    {
      id: 1,
      name: 'DevOps Admin',
      email: 'admin@clouddeploy.local',
      // Password123!
      password_hash: '$2a$10$7vN3X/tI3C5L8JgY017Gbe8KqZkF68N3sW6g.c0xZt7bFkJc5l0/G',
      created_at: new Date('2026-01-01T00:00:00Z')
    }
  ],
  projects: [
    {
      id: 1,
      name: 'Demo Application Service',
      description: 'Core microservice for automated container delivery pipeline',
      github_repository: 'github.com/clouddeploy/demo-app',
      github_branch: 'main',
      created_at: new Date(Date.now() - 86400000 * 7),
      updated_at: new Date()
    },
    {
      id: 2,
      name: 'Payment Gateway API',
      description: 'PCI-DSS compliant payment processing microservice',
      github_repository: 'github.com/clouddeploy/payment-service',
      github_branch: 'main',
      created_at: new Date(Date.now() - 86400000 * 5),
      updated_at: new Date()
    },
    {
      id: 3,
      name: 'Authentication Service',
      description: 'Centralized OAuth2 and JWT authentication identity provider',
      github_repository: 'github.com/clouddeploy/auth-service',
      github_branch: 'release/v2',
      created_at: new Date(Date.now() - 86400000 * 4),
      updated_at: new Date()
    },
    {
      id: 4,
      name: 'Frontend Web Portal',
      description: 'React client dashboard portal with edge CDN caching',
      github_repository: 'github.com/clouddeploy/web-portal',
      github_branch: 'main',
      created_at: new Date(Date.now() - 86400000 * 2),
      updated_at: new Date()
    }
  ],
  deployments: [
    {
      id: 1,
      project_id: 1,
      version: 'v1.0.4',
      commit_sha: 'a83f91c',
      environment: 'Production',
      status: 'SUCCESS',
      started_at: new Date(Date.now() - 7200000),
      completed_at: new Date(Date.now() - 7080000),
      error_message: null
    },
    {
      id: 2,
      project_id: 1,
      version: 'v1.0.3',
      commit_sha: '7ec281b',
      environment: 'Staging',
      status: 'SUCCESS',
      started_at: new Date(Date.now() - 86400000),
      completed_at: new Date(Date.now() - 86280000),
      error_message: null
    },
    {
      id: 3,
      project_id: 1,
      version: 'v1.0.2',
      commit_sha: 'f49a120',
      environment: 'Production',
      status: 'FAILED',
      started_at: new Date(Date.now() - 172800000),
      completed_at: new Date(Date.now() - 172620000),
      error_message: 'Build step failed: Docker daemon out of memory'
    },
    {
      id: 4,
      project_id: 1,
      version: 'v1.0.1',
      commit_sha: 'c281e59',
      environment: 'Production',
      status: 'ROLLED_BACK',
      started_at: new Date(Date.now() - 259200000),
      completed_at: new Date(Date.now() - 258900000),
      error_message: 'Health check timed out after 120s - initiated automated rollback'
    },
    {
      id: 5,
      project_id: 2,
      version: 'v2.1.0',
      commit_sha: 'bb1048a',
      environment: 'Production',
      status: 'SUCCESS',
      started_at: new Date(Date.now() - 18000000),
      completed_at: new Date(Date.now() - 17760000),
      error_message: null
    },
    {
      id: 6,
      project_id: 3,
      version: 'v2.0.3',
      commit_sha: '39f82d1',
      environment: 'Production',
      status: 'SUCCESS',
      started_at: new Date(Date.now() - 43200000),
      completed_at: new Date(Date.now() - 43020000),
      error_message: null
    },
    {
      id: 7,
      project_id: 4,
      version: 'v3.2.1',
      commit_sha: '90e44ac',
      environment: 'Production',
      status: 'SUCCESS',
      started_at: new Date(Date.now() - 64800000),
      completed_at: new Date(Date.now() - 64500000),
      error_message: null
    }
  ],
  environments: [
    {
      id: 1,
      project_id: 1,
      name: 'Development',
      status: 'Healthy',
      current_version: 'v1.0.5-alpha',
      application_url: 'https://dev.demo-app.internal',
      created_at: new Date()
    },
    {
      id: 2,
      project_id: 1,
      name: 'Staging',
      status: 'Healthy',
      current_version: 'v1.0.4',
      application_url: 'https://staging.demo-app.internal',
      created_at: new Date()
    },
    {
      id: 3,
      project_id: 1,
      name: 'Production',
      status: 'Healthy',
      current_version: 'v1.0.4',
      application_url: 'https://demo-app.clouddeploy.internal',
      created_at: new Date()
    },
    {
      id: 4,
      project_id: 2,
      name: 'Production',
      status: 'Healthy',
      current_version: 'v2.1.0',
      application_url: 'https://payment.clouddeploy.internal',
      created_at: new Date()
    },
    {
      id: 5,
      project_id: 3,
      name: 'Production',
      status: 'Healthy',
      current_version: 'v2.0.3',
      application_url: 'https://auth.clouddeploy.internal',
      created_at: new Date()
    },
    {
      id: 6,
      project_id: 4,
      name: 'Production',
      status: 'Healthy',
      current_version: 'v3.2.1',
      application_url: 'https://app.clouddeploy.internal',
      created_at: new Date()
    }
  ]
};

const query = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.message.includes('timeout') || err.message.includes('Connection terminated')) {
      logger.warn(`PostgreSQL unavailable: ${err.message}. Operating in resilient memory-store mode.`);
      throw err;
    }
    throw err;
  }
};

module.exports = {
  query,
  pool,
  memoryStore,
  isPostgresConnected: () => isPgConnected
};

