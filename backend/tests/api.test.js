const request = require('supertest');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_ci_cd_platform_2026';

const app = require('../server');

describe('Intelligent Cloud Deployment Platform - API Test Suite', () => {
  let authToken = '';
  const testUser = {
    name: 'Pipeline Engineer',
    email: `test-${Date.now()}@clouddeploy.local`,
    password: 'SecurePassword123!'
  };

  describe('1. Health Check Endpoint', () => {
    it('GET /api/health should return 200 and healthy payload', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        service: 'deployment-platform-api'
      });
    });
  });

  describe('2. Authentication Endpoints', () => {
    it('POST /api/auth/register should create a new user and return token', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email.toLowerCase());
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('POST /api/auth/register should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body).toHaveProperty('error');
    });

    it('POST /api/auth/login should authenticate user and return JWT', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testUser.email.toLowerCase());
      authToken = response.body.token;
    });

    it('POST /api/auth/login should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword456!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('GET /api/auth/me should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user.email).toBe(testUser.email.toLowerCase());
    });
  });

  describe('3. Project Management Endpoints', () => {
    it('GET /api/projects should require authentication', async () => {
      await request(app)
        .get('/api/projects')
        .expect(401);
    });

    it('GET /api/projects should return project array when authenticated', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('POST /api/projects should create a new project and initialize environments', async () => {
      const newProj = {
        name: 'Microservice Analytics',
        description: 'Real-time telemetry event streaming pipeline',
        github_repository: 'github.com/clouddeploy/analytics-engine',
        github_branch: 'main'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProj)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.name).toBe(newProj.name);
      expect(response.body.data.github_repository).toBe(newProj.github_repository);
    });
  });

  describe('4. Error Handling', () => {
    it('GET /unknown-route should return 404 JSON', async () => {
      const response = await request(app)
        .get('/api/undefined-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});

