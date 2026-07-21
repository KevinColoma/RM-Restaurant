// Covers the JSON endpoints the SPA calls. Before these existed the paths
// matched no route, so in production the catch-all answered with the SPA's own
// index.html and every list silently rendered as empty. Each test asserts the
// response is really JSON and carries the key the frontend reads, so a
// regression back to HTML fails loudly here.

const request = require('supertest');
const { setupDB, teardownDB } = require('./helpers/db');
const Rol = require('../models/Rol');
const Persona = require('../models/Persona');
const Usuario = require('../models/Usuario');
const Supplier = require('../models/Supplier');
const Menu = require('../models/menu');
const Customer = require('../models/Customer');
const InventoryItem = require('../models/InventoryItem');
const Branch = require('../models/branchRestaurant');
const app = require('../app');
const bcrypt = require('bcrypt');

let token;
let personaId;
let supplierId;

beforeAll(async () => {
  await setupDB();
  await Rol.create({ nombre: 'admin' });

  const persona = await Persona.create({
    ownerName: 'Api Owner', restaurantName: 'Api Resto',
    city: 'Test', address: 'Test', mobile: '1234567890'
  });
  personaId = persona._id;

  const hashedPassword = await bcrypt.hash('password123', 10);
  await Usuario.create({
    username: 'api@test.com', password: hashedPassword,
    personaId, rolId: (await Rol.findOne({ nombre: 'admin' }))._id
  });

  supplierId = (await Supplier.create({
    name: 'Api Supplier', contactInfo: '123 - Street', personaId
  }))._id;

  await Menu.create({ personaId, item: 'Api Dish', category: 'Veg', subCategory: 'Starter', price: 12.5 });
  await Customer.create({ personaId, name: 'Api Customer', phone: '555', address: 'Somewhere' });
  await InventoryItem.create({ personaId, name: 'Api Item', quantity: 3, price: 2.5, supplier: supplierId });
  await Branch.create({
    personaId, Parent_Rest: 'Api Resto', ownerName: 'Api Owner',
    restaurantName: 'Api Branch', city: 'Test', address: 'Test',
    email: 'branch@test.com', mobile: 123456
  });

  const res = await request(app)
    .post('/api/signin')
    .send({ email: 'api@test.com', password: 'password123' });
  token = res.body.token;
});

afterAll(teardownDB);

const authGet = (path) => request(app).get(path).set('Cookie', [`jwt=${token}`]);

describe('SPA JSON endpoints return data, not the app shell', () => {
  const cases = [
    ['/api/menu', 'menus'],
    ['/api/customers', 'customers'],
    ['/api/inventory', 'inventoryItems'],
    ['/api/branches', 'branches'],
    ['/api/purchases', 'purchases'],
    ['/api/orders', 'orders'],
    ['/api/audit-log', 'logs']
  ];

  it.each(cases)('%s responds with JSON and a %s array', async (path, key) => {
    const res = await authGet(path);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body[key])).toBe(true);
  });

  it('returns the seeded records rather than an empty list', async () => {
    const menu = await authGet('/api/menu');
    const customers = await authGet('/api/customers');
    const inventory = await authGet('/api/inventory');
    const branches = await authGet('/api/branches');

    expect(menu.body.menus.some(m => m.item === 'Api Dish')).toBe(true);
    expect(customers.body.customers.some(c => c.name === 'Api Customer')).toBe(true);
    expect(inventory.body.inventoryItems.some(i => i.name === 'Api Item')).toBe(true);
    expect(branches.body.branches.some(b => b.restaurantName === 'Api Branch')).toBe(true);
  });

  it('populates the supplier name inventory rows display', async () => {
    const res = await authGet('/api/inventory');
    const item = res.body.inventoryItems.find(i => i.name === 'Api Item');
    expect(item.supplier.name).toBe('Api Supplier');
  });
});

describe('Composite screens', () => {
  it('GET /api/dashboard returns today\'s figures', async () => {
    const res = await authGet('/api/dashboard');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('totalOrders');
    expect(res.body).toHaveProperty('totalEarnings');
    expect(res.body).toHaveProperty('totalExpenses');
    expect(res.body).toHaveProperty('totalPurchaseAmount');
    expect(res.body).toHaveProperty('netProfit');
    expect(Array.isArray(res.body.orderTypeBreakdown)).toBe(true);
    expect(Array.isArray(res.body.expensesByCategory)).toBe(true);
    expect(Array.isArray(res.body.mostPopularItems)).toBe(true);
  });

  it('GET /api/pos returns menus and customers together', async () => {
    const res = await authGet('/api/pos');

    expect(res.body.success).toBe(true);
    expect(res.body.menus.some(m => m.item === 'Api Dish')).toBe(true);
    expect(res.body.customers.some(c => c.name === 'Api Customer')).toBe(true);
  });

  it('GET /api/profile returns the persona and the fields the header shows', async () => {
    const res = await authGet('/api/profile');

    expect(res.body.success).toBe(true);
    expect(res.body.persona.ownerName).toBe('Api Owner');
    expect(res.body.ownerName).toBe('Api Owner');
    expect(res.body.restaurantName).toBe('Api Resto');
  });

  it('GET /api/settings returns the persona', async () => {
    const res = await authGet('/api/settings');

    expect(res.body.success).toBe(true);
    expect(res.body.persona.restaurantName).toBe('Api Resto');
  });
});

describe('GET /api/inventory/edit/:id', () => {
  it('returns the item together with the supplier list for the dropdown', async () => {
    const item = await InventoryItem.findOne({ personaId, name: 'Api Item' });
    const res = await authGet('/api/inventory/edit/' + item._id);

    expect(res.status).toBe(200);
    expect(res.body.item.name).toBe('Api Item');
    expect(res.body.suppliers.some(s => s.name === 'Api Supplier')).toBe(true);
  });

  it('rejects an invalid id and reports a missing one', async () => {
    expect((await authGet('/api/inventory/edit/not-an-id')).status).toBe(400);
    expect((await authGet('/api/inventory/edit/507f1f77bcf86cd799439011')).status).toBe(404);
  });
});

describe('Account scoping', () => {
  it('never returns another account\'s records', async () => {
    const other = await Persona.create({
      ownerName: 'Other', restaurantName: 'Other', city: 'X', address: 'Y', mobile: '9'
    });
    await Menu.create({ personaId: other._id, item: 'Foreign Dish', category: 'Veg', subCategory: 'Soup', price: 1 });
    await Customer.create({ personaId: other._id, name: 'Foreign Customer', phone: '1', address: 'Z' });

    const menu = await authGet('/api/menu');
    const customers = await authGet('/api/customers');

    expect(menu.body.menus.every(m => m.item !== 'Foreign Dish')).toBe(true);
    expect(customers.body.customers.every(c => c.name !== 'Foreign Customer')).toBe(true);
  });
});

describe('Creating through the SPA paths', () => {
  it('POST /api/menu persists a dish that then appears in the list', async () => {
    const created = await request(app)
      .post('/api/menu')
      .set('Cookie', [`jwt=${token}`])
      .send({ item: 'Created Dish', category: 'Veg', subCategory: 'Salad', price: 8.75 });

    expect([200, 201]).toContain(created.status);

    const list = await authGet('/api/menu');
    expect(list.body.menus.some(m => m.item === 'Created Dish')).toBe(true);
  });

  it('POST /api/inventory persists an item that then appears in the list', async () => {
    const created = await request(app)
      .post('/api/inventory')
      .set('Cookie', [`jwt=${token}`])
      .send({ name: 'Created Item', quantity: 9, price: 1.25, supplier: supplierId });

    expect([200, 201]).toContain(created.status);

    const list = await authGet('/api/inventory');
    expect(list.body.inventoryItems.some(i => i.name === 'Created Item')).toBe(true);
  });
});
