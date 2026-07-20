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

// The SPA calls /api/expenses. Those paths matched no route before, so GET fell
// through to the SPA catch-all (HTML, read as an empty list) and POST 404'd
// while the UI still reported success. These lock the JSON contract in place.
describe('Expense JSON API (/api/expenses)', () => {
  it('should create an expense and return it in the list', async () => {
    const created = await request(app)
      .post('/api/expenses')
      .set('Cookie', [`jwt=${token}`])
      .send({
        category: 'supplies',
        expenseDate: new Date().toISOString(),
        amount: 42.5,
        description: 'Saved through the SPA endpoint',
        vendor: 'Acme'
      });
    expect(created.status).toBe(201);

    const list = await request(app)
      .get('/api/expenses')
      .set('Cookie', [`jwt=${token}`]);

    expect(list.status).toBe(200);
    expect(list.headers['content-type']).toMatch(/application\/json/);
    expect(list.body.success).toBe(true);
    expect(Array.isArray(list.body.expenses)).toBe(true);
    expect(list.body.expenses.some(e => e.description === 'Saved through the SPA endpoint')).toBe(true);
  });

  it('should fetch a single expense for the edit screen', async () => {
    const created = await request(app)
      .post('/api/expenses')
      .set('Cookie', [`jwt=${token}`])
      .send({ category: 'rent', expenseDate: new Date().toISOString(), amount: 10, description: 'Editable', vendor: 'V' });

    const res = await request(app)
      .get('/api/expenses/edit/' + created.body._id)
      .set('Cookie', [`jwt=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.expense.description).toBe('Editable');
  });

  it('should return 400 for an invalid id and 404 when missing', async () => {
    const bad = await request(app)
      .get('/api/expenses/edit/not-an-id')
      .set('Cookie', [`jwt=${token}`]);
    expect(bad.status).toBe(400);

    const missing = await request(app)
      .get('/api/expenses/edit/507f1f77bcf86cd799439011')
      .set('Cookie', [`jwt=${token}`]);
    expect(missing.status).toBe(404);
  });

  it('should update and delete through the plural paths the SPA uses', async () => {
    const created = await request(app)
      .post('/api/expenses')
      .set('Cookie', [`jwt=${token}`])
      .send({ category: 'labor', expenseDate: new Date().toISOString(), amount: 5, description: 'Before', vendor: 'V' });

    const updated = await request(app)
      .put('/api/expenses/' + created.body._id)
      .set('Cookie', [`jwt=${token}`])
      .send({ category: 'labor', expenseDate: new Date().toISOString(), amount: 7, description: 'After', vendor: 'V' });
    expect(updated.status).toBe(200);
    expect(updated.body.description).toBe('After');

    const removed = await request(app)
      .delete('/api/expenses/' + created.body._id)
      .set('Cookie', [`jwt=${token}`]);
    expect(removed.status).toBe(200);

    const gone = await request(app)
      .get('/api/expenses/edit/' + created.body._id)
      .set('Cookie', [`jwt=${token}`]);
    expect(gone.status).toBe(404);
  });

  it('should only list expenses belonging to the signed-in account', async () => {
    const otherPersona = await Persona.create({
      ownerName: 'Other', restaurantName: 'Other', city: 'X', address: 'Y', mobile: '999'
    });
    const Expense = require('../models/Expense');
    await Expense.create({
      personaId: otherPersona._id, expenseType: 'rent', expenseDate: new Date(),
      amount: 500, description: 'Someone else expense', paymentMethod: 'cash'
    });

    const list = await request(app)
      .get('/api/expenses')
      .set('Cookie', [`jwt=${token}`]);

    expect(list.body.expenses.every(e => e.description !== 'Someone else expense')).toBe(true);
  });
});
