const request = require('supertest');

describe('app.js', () => {
  let app;

  beforeAll(() => {
    app = require('../app');
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/this-route-does-not-exist-12345');
    expect(res.status).toBe(404);
  });

  it('sets cache-control headers on all responses', async () => {
    const res = await request(app).get('/this-route-does-not-exist-12345');
    expect(res.headers['cache-control']).toContain('no-store');
    expect(res.headers['pragma']).toBe('no-cache');
  });
});
