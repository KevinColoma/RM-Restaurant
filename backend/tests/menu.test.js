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
    ownerName: 'Test',
    restaurantName: 'Test',
    city: 'Test',
    address: 'Test',
    mobile: '1234567890'
  });
  personaId = persona._id;

  const hashedPassword = await bcrypt.hash('password123', 10);
  await Usuario.create({
    username: 'menu@test.com',
    password: hashedPassword,
    personaId: persona._id,
    rolId: (await Rol.findOne({ nombre: 'admin' }))._id
  });

  const res = await request(app)
    .post('/api/signin')
    .send({ email: 'menu@test.com', password: 'password123' });
  token = res.body.token;
});

afterAll(teardownDB);

describe('Menu CRUD', () => {
  let menuId;

  it('should create a menu item', async () => {
    const res = await request(app)
      .post('/api/addmenu')
      .set('Cookie', [`jwt=${token}`])
      .send({ item: 'Burger', category: 'Veg', subCategory: 'Main Course', price: 12.99 });

    expect(res.status).toBe(201);
    expect(res.body.item).toBe('Burger');
    menuId = res.body._id;
  });

  it('should reject menu item without auth', async () => {
    const res = await request(app)
      .post('/api/addmenu')
      .send({ item: 'Pizza', category: 'Veg', subCategory: 'Main Course', price: 15.99 });

    expect(res.status).toBe(302);
  });

  it('should update a menu item', async () => {
    const res = await request(app)
      .put(`/api/menu/${menuId}`)
      .set('Cookie', [`jwt=${token}`])
      .send({ item: 'Cheese Burger', category: 'Veg', subCategory: 'Main Course', price: 14.99 });

    expect(res.status).toBe(200);
    expect(res.body.item).toBe('Cheese Burger');
  });

  it('should reject update for non-existent item', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/menu/${fakeId}`)
      .set('Cookie', [`jwt=${token}`])
      .send({ item: 'Fake', category: 'Veg', subCategory: 'Main Course', price: 9.99 });

    expect(res.status).toBe(404);
  });

  it('should delete a menu item', async () => {
    const res = await request(app)
      .delete(`/api/menu/${menuId}`)
      .set('Cookie', [`jwt=${token}`]);

    expect(res.status).toBe(200);
  });
});
