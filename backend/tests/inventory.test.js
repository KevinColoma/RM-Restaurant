const request = require('supertest');
const mongoose = require('mongoose');
const { setupDB, teardownDB } = require('./helpers/db');
const Rol = require('../models/Rol');
const Persona = require('../models/Persona');
const Usuario = require('../models/Usuario');
const Supplier = require('../models/Supplier');
const app = require('../app');
const bcrypt = require('bcrypt');

let token;
let personaId;
let supplierId;

beforeAll(async () => {
  await setupDB();
  await Rol.create({ nombre: 'admin' });

  const persona = await Persona.create({
    ownerName: 'Test', restaurantName: 'Test',
    city: 'Test', address: 'Test', mobile: '1234567890'
  });
  personaId = persona._id;

  supplierId = (await Supplier.create({
    name: 'Test Supplier', contactInfo: '1234567890 - 123 Supplier St', personaId
  }))._id;

  const hashedPassword = await bcrypt.hash('password123', 10);
  await Usuario.create({
    username: 'inv@test.com', password: hashedPassword,
    personaId: persona._id,
    rolId: (await Rol.findOne({ nombre: 'admin' }))._id
  });

  const res = await request(app)
    .post('/api/signin')
    .send({ email: 'inv@test.com', password: 'password123' });
  token = res.body.token;
});

afterAll(teardownDB);

describe('Inventory CRUD', () => {
  let itemId;

  it('should create an inventory item', async () => {
    const res = await request(app)
      .post('/api/addinventory')
      .set('Cookie', [`jwt=${token}`])
      .send({ name: 'Tomato', quantity: 100, price: 2.5, supplier: supplierId });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Tomato');
    itemId = res.body._id;
  });

  it('should list inventory items', async () => {
    const res = await request(app)
      .get('/get-expense-list')
      .set('Cookie', [`jwt=${token}`]);

    expect(res.status).toBe(200);
  });

  it('should update an inventory item', async () => {
    const res = await request(app)
      .put(`/api/inventory/${itemId}`)
      .set('Cookie', [`jwt=${token}`])
      .send({ name: 'Fresh Tomato', quantity: 150 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Fresh Tomato');
  });

  it('should delete an inventory item', async () => {
    const res = await request(app)
      .delete(`/api/inventory/${itemId}`)
      .set('Cookie', [`jwt=${token}`]);

    expect(res.status).toBe(200);
  });

  it('should return 400 when creating with invalid data', async () => {
    const res = await request(app)
      .post('/api/addinventory')
      .set('Cookie', [`jwt=${token}`])
      .send({ name: '' });

    expect(res.status).toBe(400);
  });

  it('should return 404 when updating non-existent item', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/inventory/${fakeId}`)
      .set('Cookie', [`jwt=${token}`])
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
  });

  it('should return 404 when deleting non-existent item', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/inventory/${fakeId}`)
      .set('Cookie', [`jwt=${token}`]);

    expect(res.status).toBe(404);
  });
});
