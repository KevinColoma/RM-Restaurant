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
    username: 'cust@test.com', password: hashedPassword,
    personaId: persona._id,
    rolId: (await Rol.findOne({ nombre: 'admin' }))._id
  });

  const res = await request(app)
    .post('/api/signin')
    .send({ email: 'cust@test.com', password: 'password123' });
  token = res.body.token;
});

afterAll(teardownDB);

describe('Customer CRUD', () => {
  let customerId;

  it('should create a customer', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', [`jwt=${token}`])
      .send({ name: 'John Doe', phone: '9876543210', address: '123 Street' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('John Doe');
    customerId = res.body._id;
  });

  it('should list customers', async () => {
    const res = await request(app)
      .get('/customers-list')
      .set('Cookie', [`jwt=${token}`]);

    expect(res.status).toBe(200);
  });

  it('should update a customer', async () => {
    const res = await request(app)
      .put(`/api/customers/${customerId}`)
      .set('Cookie', [`jwt=${token}`])
      .send({ name: 'Jane Doe' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Jane Doe');
  });

  it('should delete a customer', async () => {
    const res = await request(app)
      .delete(`/api/customers/${customerId}`)
      .set('Cookie', [`jwt=${token}`]);

    expect(res.status).toBe(200);
  });
});
