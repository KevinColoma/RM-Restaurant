const request = require('supertest');
const { setupDB, teardownDB } = require('./helpers/db');
const Rol = require('../models/Rol');
const Persona = require('../models/Persona');
const Usuario = require('../models/Usuario');
const Menu = require('../models/menu');
const app = require('../app');
const bcrypt = require('bcrypt');

let token;
let personaId;
let menuItem;

beforeAll(async () => {
  await setupDB();
  await Rol.create({ nombre: 'admin' });

  const persona = await Persona.create({
    ownerName: 'Test',
    restaurantName: 'Test',
    city: 'Test',
    address: 'Test',
    mobile: '1234567890'
  });
  personaId = persona._id;

  const hashedPassword = await bcrypt.hash('password123', 10);
  await Usuario.create({
    username: 'order@test.com',
    password: hashedPassword,
    personaId: persona._id,
    rolId: (await Rol.findOne({ nombre: 'admin' }))._id
  });

  const res = await request(app)
    .post('/api/signin')
    .send({ email: 'order@test.com', password: 'password123' });
  token = res.body.token;

  menuItem = await Menu.create({
    personaId,
    item: 'Pizza',
    category: 'Veg',
    subCategory: 'Main Course',
    price: 15.99
  });
});

afterAll(teardownDB);

describe('Order Placement', () => {
  it('should place an order', async () => {
    const res = await request(app)
      .post('/api/placeorder')
      .set('Cookie', [`jwt=${token}`])
      .send({
        items: [{ menuItem: menuItem._id, quantity: 2 }],
        orderType: 'dine in',
        comment: 'Table 5'
      });

    expect(res.status).toBe(201);
    expect(res.body.totalAmount).toBeDefined();
  });

  it('should reject order without auth', async () => {
    const res = await request(app)
      .post('/api/placeorder')
      .send({
        items: [{ menuItem: menuItem._id, quantity: 1 }],
        orderType: 'take away'
      });

    expect(res.status).toBe(401);
  });

  it('should list orders', async () => {
    const res = await request(app)
      .get('/orders-list')
      .set('Cookie', [`jwt=${token}`]);

    expect(res.status).toBe(200);
  });
});
