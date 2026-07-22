// Suppliers had no tests at all, which is how its list endpoint kept replying
// with a bare array while every other one used { success, <key> } - nothing
// asserted the shape. These cover the CRUD and pin the response contract down.

const request = require('supertest');
const { setupDB, teardownDB } = require('./helpers/db');
const Rol = require('../models/Rol');
const Persona = require('../models/Persona');
const Usuario = require('../models/Usuario');
const Supplier = require('../models/Supplier');
const app = require('../app');
const bcrypt = require('bcrypt');

let token;
let personaId;

beforeAll(async () => {
  await setupDB();
  await Rol.create({ nombre: 'admin' });

  const persona = await Persona.create({
    ownerName: 'Sup Owner', restaurantName: 'Sup Resto',
    city: 'Test', address: 'Test', mobile: '1234567890'
  });
  personaId = persona._id;

  await Usuario.create({
    username: 'sup@test.com',
    password: await bcrypt.hash('password123', 10),
    personaId,
    rolId: (await Rol.findOne({ nombre: 'admin' }))._id
  });

  const res = await request(app)
    .post('/api/signin')
    .send({ email: 'sup@test.com', password: 'password123' });
  token = res.body.token;
});

afterAll(teardownDB);

const auth = (req) => req.set('Cookie', [`jwt=${token}`]);
const createSupplier = (body) =>
  auth(request(app).post('/api/suppliers')).send(body);

describe('POST /api/suppliers', () => {
  it('creates a supplier', async () => {
    const res = await createSupplier({
      name: 'Fresh Produce Co', email: 'fresh@co.test',
      phone: '555111', address: '12 Market St'
    });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Fresh Produce Co');
    expect(res.body.personaId).toBe(personaId.toString());
  });

  it('rejects a supplier with no name', async () => {
    const res = await createSupplier({ phone: '555' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('GET /api/suppliers', () => {
  it('answers with the same shape as every other list endpoint', async () => {
    const res = await auth(request(app).get('/api/suppliers'));

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    // Not a bare array: callers should not need to special-case this one.
    expect(Array.isArray(res.body)).toBe(false);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.suppliers)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('pages');
  });

  it('paginates', async () => {
    await Supplier.insertMany(
      Array.from({ length: 8 }, (_, i) => ({
        personaId, name: 'Bulk Supplier ' + i, contactInfo: 'n/a'
      }))
    );

    const res = await auth(request(app).get('/api/suppliers?page=1&limit=3'));

    expect(res.body.suppliers).toHaveLength(3);
    expect(res.body.limit).toBe(3);
    expect(res.body.total).toBeGreaterThan(3);
  });

  it('only lists this account\'s suppliers', async () => {
    const other = await Persona.create({
      ownerName: 'Other', restaurantName: 'Other', city: 'X', address: 'Y', mobile: '9'
    });
    await Supplier.create({ personaId: other._id, name: 'Foreign Supplier', contactInfo: 'x' });

    const res = await auth(request(app).get('/api/suppliers?limit=200'));

    expect(res.body.suppliers.every(s => s.name !== 'Foreign Supplier')).toBe(true);
  });
});

describe('GET /api/suppliers/:id', () => {
  it('returns one supplier', async () => {
    const created = await createSupplier({ name: 'Single Supplier', phone: '1' });
    const res = await auth(request(app).get('/api/suppliers/' + created.body._id));

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Single Supplier');
  });

  it('rejects an invalid id and reports a missing one', async () => {
    expect((await auth(request(app).get('/api/suppliers/not-an-id'))).status).toBe(400);
    expect((await auth(request(app).get('/api/suppliers/507f1f77bcf86cd799439011'))).status).toBe(404);
  });
});

describe('PUT /api/suppliers/:id', () => {
  it('updates a supplier', async () => {
    const created = await createSupplier({ name: 'Before Rename', phone: '1' });

    const res = await auth(request(app).put('/api/suppliers/' + created.body._id))
      .send({ name: 'After Rename', phone: '2', address: 'New address' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('After Rename');
  });

  it('rejects an invalid id and reports a missing one', async () => {
    expect((await auth(request(app).put('/api/suppliers/nope')).send({ name: 'x' })).status).toBe(400);
    expect((await auth(request(app).put('/api/suppliers/507f1f77bcf86cd799439011')).send({ name: 'x' })).status).toBe(404);
  });

  it('cannot update another account\'s supplier', async () => {
    const other = await Persona.create({
      ownerName: 'O', restaurantName: 'O', city: 'X', address: 'Y', mobile: '9'
    });
    const foreign = await Supplier.create({ personaId: other._id, name: 'Not Mine', contactInfo: 'x' });

    const res = await auth(request(app).put('/api/suppliers/' + foreign._id)).send({ name: 'Hijacked' });

    expect(res.status).toBe(404);
    expect((await Supplier.findById(foreign._id)).name).toBe('Not Mine');
  });
});

describe('DELETE /api/suppliers/:id', () => {
  it('deletes a supplier and it stops appearing in the list', async () => {
    const created = await createSupplier({ name: 'Delete Me', phone: '1' });

    const res = await auth(request(app).delete('/api/suppliers/' + created.body._id));
    expect(res.status).toBe(200);

    const list = await auth(request(app).get('/api/suppliers?limit=200'));
    expect(list.body.suppliers.every(s => s.name !== 'Delete Me')).toBe(true);
  });

  it('rejects an invalid id and reports a missing one', async () => {
    expect((await auth(request(app).delete('/api/suppliers/nope'))).status).toBe(400);
    expect((await auth(request(app).delete('/api/suppliers/507f1f77bcf86cd799439011'))).status).toBe(404);
  });
});

describe('Suppliers page route', () => {
  it('renders the EJS suppliers page', async () => {
    const res = await auth(request(app).get('/suppliers-list'));
    expect(res.status).toBe(200);
  });
});
