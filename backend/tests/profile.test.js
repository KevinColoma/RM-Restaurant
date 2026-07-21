const request = require('supertest');
const mongoose = require('mongoose');
const { setupDB, teardownDB } = require('./helpers/db');
const Rol = require('../models/Rol');
const Persona = require('../models/Persona');
const Usuario = require('../models/Usuario');
const app = require('../app');
const bcrypt = require('bcrypt');

let token;
let personaId;

async function getToken(email, pass) {
  // Signing in is refused while a live session exists, so release any session
  // left over from an earlier sign-in in this file first.
  await Usuario.updateOne({ username: email }, { activeSessionId: null, lastSeenAt: null });
  const res = await request(app).post('/api/signin').send({ email, password: pass });
  return res.body.token;
}

beforeAll(async () => {
  await setupDB();
  await Rol.create({ nombre: 'admin' });

  const persona = await Persona.create({
    ownerName: 'Test', restaurantName: 'Test',
    city: 'Test', address: 'Test', mobile: '1234567890'
  });
  personaId = persona._id;

  const hashedPassword = await bcrypt.hash('password123', 10);
  await Usuario.create({
    username: 'profile@test.com', password: hashedPassword,
    personaId: persona._id,
    rolId: (await Rol.findOne({ nombre: 'admin' }))._id
  });

  token = await getToken('profile@test.com', 'password123');
});

afterAll(teardownDB);

describe('Profile', () => {
  it('should get profile page', async () => {
    const res = await request(app)
      .get('/profile')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(200);
  });

  it('should update profile', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Cookie', [`jwt=${token}`])
      .send({ ownerName: 'Updated Owner', city: 'New City' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject extra fields in profile update', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Cookie', [`jwt=${token}`])
      .send({ ownerName: 'Test', maliciousField: 'injected', $set: { personaId: 'bad' } });
    expect(res.status).toBe(200);
    expect(res.body.persona).toBeDefined();
    expect(res.body.persona.ownerName).toBe('Test');
  });

  it('should change password', async () => {
    const res = await request(app)
      .put('/api/profile/password')
      .set('Cookie', [`jwt=${token}`])
      .send({ currentPassword: 'password123', newPassword: 'newpass123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    token = await getToken('profile@test.com', 'newpass123');
    expect(token).toBeDefined();
  });

  it('should reject wrong current password', async () => {
    const res = await request(app)
      .put('/api/profile/password')
      .set('Cookie', [`jwt=${token}`])
      .send({ currentPassword: 'wrongpass', newPassword: 'newpass456' });
    expect(res.status).toBe(400);
  });

  it('should reject password change without auth', async () => {
    const res = await request(app)
      .put('/api/profile/password')
      .send({ currentPassword: 'password123', newPassword: 'newpass123' });
    expect(res.status).toBe(401);
  });

  it('should reject empty current password', async () => {
    const res = await request(app)
      .put('/api/profile/password')
      .set('Cookie', [`jwt=${token}`])
      .send({ newPassword: 'newpass123' });
    expect(res.status).toBe(400);
  });

  it('should reject short new password', async () => {
    const res = await request(app)
      .put('/api/profile/password')
      .set('Cookie', [`jwt=${token}`])
      .send({ currentPassword: 'newpass123', newPassword: 'ab' });
    expect(res.status).toBe(400);
  });
});