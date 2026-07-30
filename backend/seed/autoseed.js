const bcrypt = require('bcrypt');
const Rol = require('../models/Rol');
const Usuario = require('../models/Usuario');
const Persona = require('../models/Persona');

async function ensureUser(email, password, rolName, adminPersonaId) {
  const rol = await Rol.findOne({ nombre: rolName });
  if (!rol) {
    console.log(`[autoseed] Rol "${rolName}" not found, skipping user ${email}`);
    return;
  }

  const existing = await Usuario.findOne({ username: email });
  if (existing) {
    if (String(existing.personaId) !== String(adminPersonaId)) {
      await Persona.deleteOne({ _id: existing.personaId });
      existing.personaId = adminPersonaId;
      existing.password = await bcrypt.hash(password, 10);
      existing.rolId = rol._id;
      existing.isadmin = false;
      await existing.save();
      console.log(`[autoseed] User ${email} reassigned to admin persona`);
    } else {
      existing.password = await bcrypt.hash(password, 10);
      existing.rolId = rol._id;
      await existing.save();
      console.log(`[autoseed] User ${email} password/role updated`);
    }
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await Usuario.create({
    username: email,
    password: hashed,
    personaId: adminPersonaId,
    rolId: rol._id,
    isadmin: false
  });
  console.log(`[autoseed] User created: ${email} / ${rolName}`);
}

module.exports = async function autoSeed() {
  try {
    const adminUser = await Usuario.findOne({ username: 'admin@spicegarden.com' });
    if (!adminUser) {
      console.log('[autoseed] Admin user not found, skipping seed');
      return;
    }
    const adminPersonaId = adminUser.personaId;
    console.log('[autoseed] Admin persona:', adminPersonaId);

    const roleDefs = [
      { nombre: 'mesero', descripcion: 'Mesero - acceso a POS, pedidos y perfil' },
      { nombre: 'cocinero', descripcion: 'Cocinero - acceso a pedidos, menú y perfil' },
      { nombre: 'gerente', descripcion: 'Gerente - acceso a operación del restaurante' }
    ];
    for (const r of roleDefs) {
      await Rol.findOneAndUpdate(
        { nombre: r.nombre },
        { $setOnInsert: r },
        { upsert: true, new: true }
      );
    }

    await ensureUser('mesero@gmail.com', 'mesero123', 'mesero', adminPersonaId);
    await ensureUser('cocinero@spicegarden.com', 'cocinero123', 'cocinero', adminPersonaId);

    console.log('[autoseed] Done');
  } catch (err) {
    console.error('[autoseed] Error:', err.message);
  }
};
