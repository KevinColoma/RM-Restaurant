const request = require('supertest');
const { setupDB, teardownDB } = require('./helpers/db');
const Rol = require('../models/Rol');
const Persona = require('../models/Persona');
const Usuario = require('../models/Usuario');
const Supplier = require('../models/Supplier');
const Menu = require('../models/menu');
const InventoryItem = require('../models/InventoryItem');
const Expense = require('../models/Expense');
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
    username: 'pages@test.com', password: hashedPassword,
    personaId: persona._id,
    rolId: (await Rol.findOne({ nombre: 'admin' }))._id
  });

  const res = await request(app)
    .post('/api/signin')
    .send({ email: 'pages@test.com', password: 'password123' });
  token = res.body.token;
});

afterAll(teardownDB);

describe('Public page routes', () => {
  it('renders the signup page on GET /', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });

  it('renders the signin page on GET /signin', async () => {
    const res = await request(app).get('/signin');
    expect(res.status).toBe(200);
  });

  it('renders the forgot-password page on GET /forgot-password', async () => {
    const res = await request(app).get('/forgot-password');
    expect(res.status).toBe(200);
  });
});

describe('Authenticated static page routes', () => {
  it('renders add-item page on GET /addmenupage', async () => {
    const res = await request(app)
      .get('/addmenupage')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(200);
  });

  it('renders chart-js page on GET /chart-js', async () => {
    const res = await request(app)
      .get('/chart-js')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(200);
  });

  it('renders datechart page on GET /datechart', async () => {
    const res = await request(app)
      .get('/datechart')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(200);
  });
});

describe('GET /edit-item/:id', () => {
  it('returns 400 for an invalid id', async () => {
    const res = await request(app)
      .get('/edit-item/not-a-valid-id')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(400);
  });

  it('returns 404 when the menu item does not exist', async () => {
    const res = await request(app)
      .get('/edit-item/507f1f77bcf86cd799439011')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(404);
  });

  it('renders edit-item when the menu item exists', async () => {
    const menu = await Menu.create({
      personaId, item: 'Test Dish', category: 'Veg',
      subCategory: 'Starter', price: 9.99
    });

    const res = await request(app)
      .get(`/edit-item/${menu._id}`)
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(200);
  });

  it('returns 500 when a database error occurs', async () => {
    jest.spyOn(Menu, 'findOne').mockImplementationOnce(() => {
      throw new Error('DB failure');
    });

    const res = await request(app)
      .get('/edit-item/507f1f77bcf86cd799439011')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(500);

    Menu.findOne.mockRestore();
  });
});

describe('GET /edit-inventory/:id', () => {
  let supplierId;

  beforeAll(async () => {
    supplierId = (await Supplier.create({
      name: 'Test Supplier', contactInfo: '1234567890 - Test St', personaId
    }))._id;
  });

  it('returns 400 for an invalid id', async () => {
    const res = await request(app)
      .get('/edit-inventory/not-a-valid-id')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(400);
  });

  it('returns 404 when the inventory item does not exist', async () => {
    const res = await request(app)
      .get('/edit-inventory/507f1f77bcf86cd799439011')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(404);
  });

  it('renders edit-inventory when the item exists', async () => {
    const item = await InventoryItem.create({
      personaId, name: 'Test Item', quantity: 10, price: 5.5, supplier: supplierId
    });

    const res = await request(app)
      .get(`/edit-inventory/${item._id}`)
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(200);
  });

  it('returns 500 when a database error occurs', async () => {
    jest.spyOn(InventoryItem, 'findOne').mockImplementationOnce(() => {
      throw new Error('DB failure');
    });

    const res = await request(app)
      .get('/edit-inventory/507f1f77bcf86cd799439011')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(500);

    InventoryItem.findOne.mockRestore();
  });
});

describe('GET /edit-expense/:id', () => {
  it('returns 400 for an invalid id', async () => {
    const res = await request(app)
      .get('/edit-expense/not-a-valid-id')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(400);
  });

  it('returns 404 when the expense does not exist', async () => {
    const res = await request(app)
      .get('/edit-expense/507f1f77bcf86cd799439011')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(404);
  });

  it('renders edit-expense when the expense exists', async () => {
    const expense = await Expense.create({
      personaId, expenseType: 'Groceries', expenseDate: new Date(),
      amount: 25.5, description: 'Test expense', paymentMethod: 'cash'
    });

    const res = await request(app)
      .get(`/edit-expense/${expense._id}`)
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(200);
  });

  it('returns 500 when a database error occurs', async () => {
    jest.spyOn(Expense, 'findOne').mockImplementationOnce(() => {
      throw new Error('DB failure');
    });

    const res = await request(app)
      .get('/edit-expense/507f1f77bcf86cd799439011')
      .set('Cookie', [`jwt=${token}`]);
    expect(res.status).toBe(500);

    Expense.findOne.mockRestore();
  });
});
