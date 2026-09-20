const request = require('supertest');
process.env.NODE_ENV = 'test';

const app = require('../src/server');

describe('Demo Application Health & Endpoints', () => {
  it('GET /health should return 200 with status healthy', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);

    expect(res.body).toEqual({
      status: 'healthy'
    });
  });

  it('GET / should return application status and version', async () => {
    const res = await request(app)
      .get('/')
      .expect(200);

    expect(res.body).toHaveProperty('application', 'Demo Application');
    expect(res.body).toHaveProperty('version', '1.0.0');
    expect(res.body).toHaveProperty('message', 'Application deployed successfully');
  });

  it('GET /api/version should return 1.0.0', async () => {
    const res = await request(app)
      .get('/api/version')
      .expect(200);

    expect(res.body).toEqual({
      version: '1.0.0'
    });
  });
});

