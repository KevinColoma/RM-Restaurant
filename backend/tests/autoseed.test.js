const { setupDB, teardownDB } = require('./helpers/db');
const Rol = require('../models/Rol');
const Usuario = require('../models/Usuario');
const Persona = require('../models/Persona');

describe('autoSeed', () => {
  beforeAll(async () => {
    await setupDB();
  });

  afterAll(teardownDB);

  beforeEach(async () => {
    await Rol.deleteMany({});
    await Usuario.deleteMany({});
    await Persona.deleteMany({});
  });

  it('creates roles and users when admin exists', async () => {
    const persona = await Persona.create({ ownerName: 'Admin', restaurantName: 'Test', city: 'City', address: 'Addr', mobile: 123 });
    await Usuario.create({ username: 'admin@spicegarden.com', password: 'hashed', personaId: persona._id, rolId: (await Rol.create({ nombre: 'admin', descripcion: 'Admin' }))._id });

    const autoSeed = require('../seed/autoseed');
    await autoSeed();

    const mesero = await Rol.findOne({ nombre: 'mesero' });
    const cocinero = await Rol.findOne({ nombre: 'cocinero' });
    const gerente = await Rol.findOne({ nombre: 'gerente' });
    expect(mesero).toBeTruthy();
    expect(cocinero).toBeTruthy();
    expect(gerente).toBeTruthy();

    const meseroUser = await Usuario.findOne({ username: 'mesero@gmail.com' });
    const cocineroUser = await Usuario.findOne({ username: 'cocinero@spicegarden.com' });
    expect(meseroUser).toBeTruthy();
    expect(String(meseroUser.personaId)).toBe(String(persona._id));
    expect(meseroUser.isadmin).toBe(false);
    expect(cocineroUser).toBeTruthy();
  });

  it('updates existing user with same persona', async () => {
    const persona = await Persona.create({ ownerName: 'Admin', restaurantName: 'Test', city: 'City', address: 'Addr', mobile: 123 });
    const adminRol = await Rol.create({ nombre: 'admin' });
    const meseroRol = await Rol.create({ nombre: 'mesero' });
    await Usuario.create({ username: 'admin@spicegarden.com', password: 'old', personaId: persona._id, rolId: adminRol._id });
    await Usuario.create({ username: 'mesero@gmail.com', password: 'oldpass', personaId: persona._id, rolId: adminRol._id, isadmin: false });

    const autoSeed = require('../seed/autoseed');
    await autoSeed();

    const user = await Usuario.findOne({ username: 'mesero@gmail.com' });
    expect(user.password).not.toBe('oldpass');
    expect(String(user.rolId)).toBe(String(meseroRol._id));
  });

  it('reassigns existing user with different persona', async () => {
    const adminPersona = await Persona.create({ ownerName: 'Admin', restaurantName: 'Test', city: 'City', address: 'Addr', mobile: 123 });
    const oldPersona = await Persona.create({ ownerName: 'Old', restaurantName: 'Old', city: 'City', address: 'Addr', mobile: 456 });
    const adminRol = await Rol.create({ nombre: 'admin' });
    const meseroRol = await Rol.create({ nombre: 'mesero' });
    await Usuario.create({ username: 'admin@spicegarden.com', password: 'h', personaId: adminPersona._id, rolId: adminRol._id });
    await Usuario.create({ username: 'mesero@gmail.com', password: 'h', personaId: oldPersona._id, rolId: adminRol._id });

    const autoSeed = require('../seed/autoseed');
    await autoSeed();

    const deletedPersona = await Persona.findById(oldPersona._id);
    expect(deletedPersona).toBeNull();

    const user = await Usuario.findOne({ username: 'mesero@gmail.com' });
    expect(String(user.personaId)).toBe(String(adminPersona._id));
  });

  it('skips gracefully when admin user is not found', async () => {
    const autoSeed = require('../seed/autoseed');
    await expect(autoSeed()).resolves.toBeUndefined();
  });

  it('skips a user when their role is not found', async () => {
    const persona = await Persona.create({ ownerName: 'Admin', restaurantName: 'Test', city: 'City', address: 'Addr', mobile: 123 });
    const adminRol = await Rol.create({ nombre: 'admin' });
    await Usuario.create({ username: 'admin@spicegarden.com', password: 'h', personaId: persona._id, rolId: adminRol._id });

    const autoSeed = require('../seed/autoseed');
    await autoSeed();

    const user = await Usuario.findOne({ username: 'mesero@gmail.com' });
    expect(user).toBeTruthy();
  });
});
