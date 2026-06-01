const Restaurant = require('../models/restaurant');
const bcrypt = require('bcrypt');
const { logAudit } = require('../utils/audit');

exports.getProfile = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurant.restaurantId);
    if (!restaurant) return res.status(404).send('Restaurant not found');
    const avatarUrl = restaurant.avatar || '/uploads/avatar-' + req.restaurant.restaurantId + '.png';
    res.render('profile', { restaurant, avatarUrl });
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

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.restaurant.restaurantId,
      update,
      { new: true, runValidators: true }
    );
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    await logAudit(req, 'update', 'Restaurant', restaurant._id, 'Profile updated: ' + ownerName);
    res.json({ success: true, restaurant });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const avatarUrl = '/uploads/' + req.file.filename;
    await Restaurant.findByIdAndUpdate(req.restaurant.restaurantId, { avatar: avatarUrl });
    await logAudit(req, 'update', 'Restaurant', req.restaurant.restaurantId, 'Avatar updated');
    res.json({ success: true, avatarUrl });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const restaurant = await Restaurant.findById(req.restaurant.restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const isMatch = await bcrypt.compare(currentPassword, restaurant.password);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    restaurant.password = await bcrypt.hash(newPassword, 10);
    await restaurant.save();
    await logAudit(req, 'password_change', 'Restaurant', restaurant._id, 'Password changed');
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
