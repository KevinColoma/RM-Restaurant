const request = require('supertest');
const mongoose = require('mongoose');
const { setupDB, teardownDB } = require('./helpers/db');
const Rol = require('../models/Rol');
const Usuario = require('../models/Usuario');
const { SESSION_IDLE_MS } = require('../config/session');
const app = require('../app');

beforeAll(async () => {
  await setupDB();
  await Rol.create({ nombre: 'admin' });
});

afterAll(teardownDB);

describe('POST /api/signup', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({
        email: 'test@example.com',
        ownerName: 'Test Owner',
        restaurantName: 'Test Restaurant',
        city: 'Test City',
        address: '123 Test St',
        mobile: '1234567890',
        password: 'password123'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({
        email: 'test@example.com',
        ownerName: 'Test Owner',
        restaurantName: 'Test Restaurant',
        city: 'Test City',
        address: '123 Test St',
        mobile: '1234567890',
        password: 'password123'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/signin', () => {
  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/signin')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/signin')
      .send({ email: 'test@example.com', password: 'wrongpass' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
  });

  it('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/signin')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
  });
});

describe('Single-session policy', () => {
  const signIn = () => request(app)
    .post('/api/signin')
    .send({ email: 'test@example.com', password: 'password123' });

  // Earlier tests in this file leave test@example.com signed in, which would
  // make the "first" login below hit the block. Start each case signed out.
  beforeEach(async () => {
    await Usuario.updateOne(
      { username: 'test@example.com' },
      { activeSessionId: null, lastSeenAt: null }
    );
  });

  it('should refuse a second login while another session is alive', async () => {
    const first = await signIn();
    expect(first.body.success).toBe(true);

    const second = await signIn();

    expect(second.body.success).toBe(false);
    expect(second.body.sessionInUse).toBe(true);
    expect(second.body.token).toBeUndefined();
  });

  it('should keep the live session working after a blocked login attempt', async () => {
    const first = await signIn();
    await signIn(); // blocked, must not disturb the existing session

    const stillValid = await request(app)
      .get('/api/personas')
      .set('Cookie', [`jwt=${first.body.token}`]);

    expect(stillValid.status).toBe(200);
  });

  it('should allow signing in again once the previous session goes stale', async () => {
    await signIn();

    // Simulate the browser vanishing without logging out: the session record
    // stays behind, but nothing refreshes lastSeenAt past the idle window.
    await Usuario.updateOne(
      { username: 'test@example.com' },
      { lastSeenAt: new Date(Date.now() - (SESSION_IDLE_MS + 1000)) }
    );

    const retry = await signIn();

    expect(retry.body.success).toBe(true);
    expect(retry.body.token).toBeDefined();
  });

  it('should free the account immediately after an explicit logout', async () => {
    const first = await signIn();

    await request(app)
      .post('/api/log-out')
      .set('Cookie', [`jwt=${first.body.token}`]);

    const retry = await signIn();

    expect(retry.body.success).toBe(true);
  });

  it('should refresh lastSeenAt as the active session makes requests', async () => {
    const first = await signIn();
    await Usuario.updateOne({ username: 'test@example.com' }, { lastSeenAt: new Date(0) });

    await request(app)
      .get('/api/personas')
      .set('Cookie', [`jwt=${first.body.token}`]);

    const usuario = await Usuario.findOne({ username: 'test@example.com' });
    expect(usuario.lastSeenAt.getTime()).toBeGreaterThan(Date.now() - 60000);
  });
});
