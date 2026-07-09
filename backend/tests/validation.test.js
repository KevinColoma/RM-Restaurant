const request = require('supertest');
const mongoose = require('mongoose');
const { setupDB, teardownDB } = require('./helpers/db');
const Rol = require('../models/Rol');
const Persona = require('../models/Persona');
const Usuario = require('../models/Usuario');
const Menu = require('../models/menu');
const Supplier = require('../models/Supplier');
const Branch = require('../models/branchRestaurant');
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
    username: 'val@test.com', password: hashedPassword,
    personaId: persona._id,
    rolId: (await Rol.findOne({ nombre: 'admin' }))._id
  });

  const res = await request(app)
    .post('/api/signin')
    .send({ email: 'val@test.com', password: 'password123' });
  token = res.body.token;
});

afterAll(teardownDB);

describe('Input validation - ObjectId injection protection', () => {
  it('rejects invalid ObjectId on menu update', async () => {
    const res = await request(app)
      .put('/api/menu/not-a-valid-id')
      .set('Cookie', [`jwt=${token}`])
      .send({ item: 'Test' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid ObjectId on menu delete', async () => {
    const res = await request(app)
      .delete('/api/menu/not-a-valid-id')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(400);
  });

  it('rejects invalid ObjectId on inventory update', async () => {
    const res = await request(app)
      .put('/api/inventory/bad-id')
      .set('Cookie', [`jwt=${token}`])
      .send({ name: 'Test' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid ObjectId on inventory delete', async () => {
    const res = await request(app)
      .delete('/api/inventory/bad-id')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(400);
  });

  it('rejects invalid ObjectId on customer update', async () => {
    const res = await request(app)
      .put('/api/customers/invalid')
      .set('Cookie', [`jwt=${token}`])
      .send({ name: 'Test' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid ObjectId on customer delete', async () => {
    const res = await request(app)
      .delete('/api/customers/invalid')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(400);
  });

  it('rejects invalid ObjectId on expense delete', async () => {
    const res = await request(app)
      .delete('/api/expense/invalid')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(400);
  });

  it('rejects invalid ObjectId on supplier get', async () => {
    const res = await request(app)
      .get('/api/suppliers/invalid')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(400);
  });

  it('rejects invalid ObjectId on supplier update', async () => {
    const res = await request(app)
      .put('/api/suppliers/invalid')
      .set('Cookie', [`jwt=${token}`])
      .send({ name: 'Test' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid ObjectId on supplier delete', async () => {
    const res = await request(app)
      .delete('/api/suppliers/invalid')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(400);
  });

  it('rejects invalid ObjectId on branch get', async () => {
    const res = await request(app)
      .get('/api/branches/invalid')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(400);
  });

  it('rejects invalid ObjectId on branch update', async () => {
    const res = await request(app)
      .put('/api/branches/invalid')
      .set('Cookie', [`jwt=${token}`])
      .send({ restaurantName: 'Test' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid ObjectId on branch delete', async () => {
    const res = await request(app)
      .delete('/api/branches/invalid')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(400);
  });

  it('rejects invalid ObjectId on purchase get', async () => {
    const res = await request(app)
      .get('/api/purchases/invalid')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(400);
  });

  it('rejects invalid ObjectId on purchase delete', async () => {
    const res = await request(app)
      .delete('/api/purchases/invalid')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(400);
  });

  it('rejects invalid ObjectId on order delete', async () => {
    const res = await request(app)
      .delete('/api/orders/invalid')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(400);
  });
});

describe('Input validation - Supplier no mass assignment', () => {
  it('should not allow injecting personaId via body', async () => {
    const res = await request(app)
      .post('/api/suppliers')
      .set('Cookie', [`jwt=${token}`])
      .send({ name: 'Test Supplier', contactInfo: '123456', personaId: '000000000000000000000000' });
    expect(res.status).toBe(201);
    expect(res.body.personaId).toBe(personaId.toString());
  });
});

describe('Input validation - Branch no mass assignment', () => {
  it('should not allow injecting personaId via update body', async () => {
    const branch = await Branch.create({
      personaId, Parent_Rest: 'Test', ownerName: 'Test',
      restaurantName: 'Test', city: 'Test', address: 'Test',
      email: 'test@test.com', mobile: '1234567890'
    });
    const res = await request(app)
      .put(`/api/branches/${branch._id}`)
      .set('Cookie', [`jwt=${token}`])
      .send({ restaurantName: 'Updated', personaId: '000000000000000000000000' });
    expect(res.status).toBe(200);
    expect(res.body.restaurantName).toBe('Updated');
    expect(res.body.personaId).toBe(personaId.toString());
  });
});

describe('Input validation - Order items', () => {
  it('rejects order with empty items', async () => {
    const res = await request(app)
      .post('/api/placeorder')
      .set('Cookie', [`jwt=${token}`])
      .send({ items: [], orderType: 'dine in' });
    expect(res.status).toBe(400);
  });

  it('rejects order with invalid menuItem ID', async () => {
    const res = await request(app)
      .post('/api/placeorder')
      .set('Cookie', [`jwt=${token}`])
      .send({ items: [{ menuItem: 'bad-id', quantity: 1 }], orderType: 'dine in' });
    expect(res.status).toBe(400);
  });

  it('rejects order with negative quantity', async () => {
    const menuItem = await Menu.create({
      personaId, item: 'Test', category: 'Veg', subCategory: 'Main Course', price: 10
    });
    const res = await request(app)
      .post('/api/placeorder')
      .set('Cookie', [`jwt=${token}`])
      .send({ items: [{ menuItem: menuItem._id, quantity: -1 }], orderType: 'dine in' });
    expect(res.status).toBe(400);
  });
});

describe('Report endpoints - auth required', () => {
  it('should reject unauthenticated access to sales report', async () => {
    const res = await request(app).get('/api/reports/sales');
    expect(res.status).toBe(302);
  });

  it('should reject unauthenticated access to orders report', async () => {
    const res = await request(app).get('/api/reports/orders');
    expect(res.status).toBe(302);
  });

  it('should reject unauthenticated access to sales by date report', async () => {
    const res = await request(app).get('/api/reports/sales-by-date?startDate=2026-01-01&endDate=2026-01-31');
    expect(res.status).toBe(302);
  });

  it('should reject unauthenticated access to orders by date report', async () => {
    const res = await request(app).get('/api/reports/orders-by-date?startDate=2026-01-01&endDate=2026-01-31');
    expect(res.status).toBe(302);
  });
});

describe('Date validation in reports', () => {
  it('should reject invalid date format', async () => {
    const res = await request(app)
      .get('/api/reports/sales-by-date?startDate=not-a-date&endDate=also-not')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(400);
  });
});