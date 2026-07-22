// The dashboard aggregation only ran against empty data before, so the part
// that actually counts anything - tallying items across orders to find the
// best sellers - was never executed. These give it real orders to add up.

const request = require('supertest');
const { setupDB, teardownDB } = require('./helpers/db');
const Rol = require('../models/Rol');
const Persona = require('../models/Persona');
const Usuario = require('../models/Usuario');
const Menu = require('../models/menu');
const Order = require('../models/order');
const Expense = require('../models/Expense');
const app = require('../app');
const bcrypt = require('bcrypt');

let token;
let personaId;
let curry;
let naan;

beforeAll(async () => {
  await setupDB();
  await Rol.create({ nombre: 'admin' });

  const persona = await Persona.create({
    ownerName: 'Dash Owner', restaurantName: 'Dash Resto',
    city: 'Test', address: 'Test', mobile: '1234567890'
  });
  personaId = persona._id;

  await Usuario.create({
    username: 'dash@test.com',
    password: await bcrypt.hash('password123', 10),
    personaId,
    rolId: (await Rol.findOne({ nombre: 'admin' }))._id
  });

  curry = await Menu.create({
    personaId, item: 'Chicken Curry', category: 'Non-Veg', subCategory: 'Main Course', price: 12
  });
  naan = await Menu.create({
    personaId, item: 'Garlic Naan', category: 'Veg', subCategory: 'Roti', price: 3
  });

  // Today's trade: naan outsells curry, so it should lead the popular list.
  await Order.create({
    personaId, totalAmount: 27, taxAmount: 2, orderType: 'dine in',
    items: [
      { menuItem: curry._id, quantity: 1, price: 12 },
      { menuItem: naan._id, quantity: 5, price: 3 }
    ]
  });
  await Order.create({
    personaId, totalAmount: 24, taxAmount: 2, orderType: 'take away',
    items: [{ menuItem: curry._id, quantity: 2, price: 12 }]
  });

  await Expense.create({
    personaId, expenseType: 'supplies', expenseDate: new Date(),
    amount: 20, description: 'Vegetables', paymentMethod: 'cash'
  });

  const res = await request(app)
    .post('/api/signin')
    .send({ email: 'dash@test.com', password: 'password123' });
  token = res.body.token;
});

afterAll(teardownDB);

// The error cases below stub countDocuments to fail. Restoring after each test
// keeps a stub from leaking into the next one - which is exactly what made the
// EJS render case fail while the route was in fact fine.
afterEach(() => jest.restoreAllMocks());

const auth = (req) => req.set('Cookie', [`jwt=${token}`]);

describe('GET /api/dashboard', () => {
  it('adds up today\'s takings, spend and order count', async () => {
    const res = await auth(request(app).get('/api/dashboard'));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.totalOrders).toBe(2);
    expect(res.body.totalEarnings).toBe(51);
    expect(res.body.totalExpenses).toBe(20);
  });

  it('ranks the best sellers by quantity across every order', async () => {
    const res = await auth(request(app).get('/api/dashboard'));
    const popular = res.body.mostPopularItems;

    // Naan sold 5, curry 1 + 2 = 3, so naan leads.
    expect(popular[0]).toEqual({ item: 'Garlic Naan', quantity: 5 });
    expect(popular.find(p => p.item === 'Chicken Curry').quantity).toBe(3);
  });

  it('never returns more than the top seven items', async () => {
    const res = await auth(request(app).get('/api/dashboard'));
    expect(res.body.mostPopularItems.length).toBeLessThanOrEqual(7);
  });

  it('includes the menu the dashboard table renders', async () => {
    const res = await auth(request(app).get('/api/dashboard'));
    expect(res.body.menus.some(m => m.item === 'Chicken Curry')).toBe(true);
  });

  it('reports a failure as JSON rather than leaking an error', async () => {
    jest.spyOn(Order, 'countDocuments').mockRejectedValueOnce(new Error('DB down'));

    const res = await auth(request(app).get('/api/dashboard'));

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(JSON.stringify(res.body)).not.toMatch(/DB down/);

    Order.countDocuments.mockRestore();
  });
});

describe('GET /index (EJS dashboard)', () => {
  it('renders with the same figures behind it', async () => {
    const res = await auth(request(app).get('/index'));
    expect(res.status).toBe(200);
  });

  it('still renders when an expense has no category', async () => {
    // category is optional on the model, and the chart's label fallback used
    // to call the browser-only t() helper - so a single uncategorised expense
    // took the whole dashboard down with a 500.
    await Expense.create({
      personaId, expenseType: 'misc', expenseDate: new Date(),
      amount: 5, description: 'No category set', paymentMethod: 'cash'
    });

    const res = await auth(request(app).get('/index'));

    expect(res.status).toBe(200);
    expect(res.text).toContain('Uncategorized');
  });

  it('returns 500 when the aggregation fails', async () => {
    jest.spyOn(Order, 'countDocuments').mockRejectedValueOnce(new Error('DB down'));

    const res = await auth(request(app).get('/index'));

    expect(res.status).toBe(500);

    Order.countDocuments.mockRestore();
  });
});
