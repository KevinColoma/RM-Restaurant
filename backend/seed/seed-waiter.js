const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Rol = require('../models/Rol');
const Usuario = require('../models/Usuario');
const Persona = require('../models/Persona');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const waiterRol = await Rol.findOneAndUpdate(
    { nombre: 'waiter' },
    { $setOnInsert: { nombre: 'waiter', descripcion: 'Mesero - acceso limitado a POS y perfil' } },
    { upsert: true, new: true }
  );
  console.log('Waiter role ready:', waiterRol._id);

  const existing = await Usuario.findOne({ username: 'mesero@gmail.com' });
  if (existing) {
    console.log('Waiter user already exists, skipping creation');
  } else {
    const persona = await Persona.create({
      ownerName: 'Mesero Demo',
      restaurantName: 'Restaurante Demo',
      city: 'Demo City',
      address: 'Demo Address',
      mobile: 1234567890
    });
    console.log('Persona created:', persona._id);

    const hashed = await bcrypt.hash('123456', 10);
    await Usuario.create({
      username: 'mesero@gmail.com',
      password: hashed,
      personaId: persona._id,
      rolId: waiterRol._id,
      isadmin: false
    });
    console.log('Waiter user created: mesero@gmail.com / 123456');
  }

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch(err => { console.error(err); process.exit(1); });
