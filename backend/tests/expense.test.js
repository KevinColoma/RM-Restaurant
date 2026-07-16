const request = require('supertest');
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
    username: 'exp@test.com', password: hashedPassword,
    personaId: persona._id,
    rolId: (await Rol.findOne({ nombre: 'admin' }))._id
  });

  const res = await request(app)
    .post('/api/signin')
    .send({ email: 'exp@test.com', password: 'password123' });
  token = res.body.token;
});

afterAll(teardownDB);

describe('Expense CRUD', () => {
  let expenseId;

  it('should create an expense', async () => {
    const res = await request(app)
      .post('/api/addexpense')
      .set('Cookie', [`jwt=${token}`])
      .send({
        category: 'Groceries',
        expenseDate: new Date().toISOString(),
        amount: 150.00,
        description: 'Buy vegetables',
        vendor: 'Supplier A'
      });

    expect(res.status).toBe(201);
    expect(res.body.description).toBe('Buy vegetables');
    expenseId = res.body._id;
  });

  it('should list expenses', async () => {
    const res = await request(app)
      .get('/getexpense')
      .set('Cookie', [`jwt=${token}`]);

    expect(res.status).toBe(200);
  });

  it('should delete an expense', async () => {
    const res = await request(app)
      .delete(`/api/expense/${expenseId}`)
      .set('Cookie', [`jwt=${token}`]);

    expect(res.status).toBe(200);
  });

  describe('Expense validation - Form improvements', () => {
    it('should reject negative amount', async () => {
      const res = await request(app)
        .post('/api/addexpense')
        .set('Cookie', [`jwt=${token}`])
        .send({
          category: 'supplies',
          expenseDate: new Date().toISOString(),
          amount: -50.00,
          description: 'Invalid negative amount',
          vendor: 'Test Vendor'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Amount must be a valid number greater than zero');
    });

    it('should reject zero amount', async () => {
      const res = await request(app)
        .post('/api/addexpense')
        .set('Cookie', [`jwt=${token}`])
        .send({
          category: 'supplies',
          expenseDate: new Date().toISOString(),
          amount: 0,
          description: 'Invalid zero amount',
          vendor: 'Test Vendor'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Amount must be a valid number greater than zero');
    });

    it('should require description field', async () => {
      const res = await request(app)
        .post('/api/addexpense')
        .set('Cookie', [`jwt=${token}`])
        .send({
          category: 'supplies',
          expenseDate: new Date().toISOString(),
          amount: 100.00,
          vendor: 'Test Vendor'
          // description missing
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('description');
    });

    it('should accept valid decimal amounts', async () => {
      const res = await request(app)
        .post('/api/addexpense')
        .set('Cookie', [`jwt=${token}`])
        .send({
          category: 'supplies',
          expenseDate: new Date().toISOString(),
          amount: 99.99,
          description: 'Valid decimal amount',
          vendor: 'Test Vendor'
        });

      expect(res.status).toBe(201);
      expect(res.body.amount).toBe(99.99);
    });

    it('should accept minimum valid amount 0.01', async () => {
      const res = await request(app)
        .post('/api/addexpense')
        .set('Cookie', [`jwt=${token}`])
        .send({
          category: 'supplies',
          expenseDate: new Date().toISOString(),
          amount: 0.01,
          description: 'Minimum valid amount',
          vendor: 'Test Vendor'
        });

      expect(res.status).toBe(201);
      expect(res.body.amount).toBe(0.01);
    });
  });
});
