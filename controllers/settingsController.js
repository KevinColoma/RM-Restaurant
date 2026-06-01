const Restaurant = require('../models/restaurant');
const { logAudit } = require('../utils/audit');

exports.getSettings = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurant.restaurantId);
    if (!restaurant) return res.status(404).send('Restaurant not found');
    res.render('settings', { restaurant });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { taxRate, currencySymbol, printerConnection, theme } = req.body;
    const update = {};
    if (taxRate !== undefined) update.taxRate = Number(taxRate);
    if (currencySymbol !== undefined) update.currencySymbol = currencySymbol;
    if (printerConnection !== undefined) update.printerConnection = printerConnection;
    if (theme !== undefined) update.theme = theme;

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.restaurant.restaurantId,
      update,
      { new: true, runValidators: true }
    );
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    await logAudit(req, 'settings_update', 'Restaurant', restaurant._id, 'Settings updated: taxRate=' + taxRate + ', currency=' + currencySymbol + ', theme=' + theme);
    res.json({ success: true, restaurant });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
