const request = require('supertest');
const mongoose = require('mongoose');
const { setupDB, teardownDB } = require('./helpers/db');
const Rol = require('../models/Rol');
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
