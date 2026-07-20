const request = require('supertest');
const mongoose = require('mongoose');
const { setupDB, teardownDB } = require('./helpers/db');
const Rol = require('../models/Rol');
const Usuario = require('../models/Usuario');
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
  // Earlier tests in this file leave test@example.com with an active session,
  // which would make the "first" login below already prompt for device
  // authorization. Reset to a clean, signed-out state before each case.
  beforeEach(async () => {
    await Usuario.updateOne({ username: 'test@example.com' }, { activeSessionId: null });
  });

  it('should require device authorization on a second concurrent login', async () => {
    const first = await request(app)
      .post('/api/signin')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(first.body.success).toBe(true);

    const second = await request(app)
      .post('/api/signin')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(second.body.success).toBe(false);
    expect(second.body.requiresDeviceAuthorization).toBe(true);
  });

  it('should issue a fresh session on forceLogin without tearing down the previous one (soft single-session)', async () => {
    const first = await request(app)
      .post('/api/signin')
      .send({ email: 'test@example.com', password: 'password123' });
    const firstToken = first.body.token;

    const second = await request(app)
      .post('/api/signin')
      .send({ email: 'test@example.com', password: 'password123', forceLogin: true });

    expect(second.body.success).toBe(true);
    expect(second.body.token).toBeDefined();
    expect(second.body.token).not.toBe(firstToken);

    // The previous session's token stays valid: soft single-session never
    // kicks an already-active session out mid-use, so navigation keeps working.
    const staleCheck = await request(app)
      .get('/api/personas')
      .set('Cookie', [`jwt=${firstToken}`]);

    expect(staleCheck.status).toBe(200);
  });
});
