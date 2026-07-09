const Persona = require('../models/Persona');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const { logAudit } = require('../utils/audit');

exports.getProfile = async (req, res) => {
  try {
    const persona = await Persona.findById(req.personaId);
    if (!persona) return res.status(404).send('Persona not found');
    const avatarUrl = persona.avatar || '/uploads/avatar-' + req.personaId + '.png';
    res.render('profile', { persona, avatarUrl });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { ownerName, restaurantName, city, address, mobile } = req.body;
    const update = { ownerName, restaurantName, city, address, mobile };

    if (req.file) {
      update.avatar = '/uploads/' + req.file.filename;
    }

    const persona = await Persona.findByIdAndUpdate(
      req.personaId,
      update,
      { new: true, runValidators: true }
    );
    if (!persona) return res.status(404).json({ error: 'Persona not found' });
    await logAudit(req, 'update', 'Persona', persona._id, 'Profile updated: ' + ownerName);
    res.json({ success: true, persona });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const avatarUrl = '/uploads/' + req.file.filename;
    await Persona.findByIdAndUpdate(req.personaId, { avatar: avatarUrl });
    await logAudit(req, 'update', 'Persona', req.personaId, 'Avatar updated');
    res.json({ success: true, avatarUrl });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const usuario = await Usuario.findById(req.usuario._id);
    if (!usuario) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, usuario.password);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    usuario.password = await bcrypt.hash(newPassword, 10);
    await usuario.save();
    await logAudit(req, 'password_change', 'Usuario', usuario._id, 'Password changed');
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
