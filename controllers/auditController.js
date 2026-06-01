const AuditLog = require('../models/AuditLog');

exports.getAuditLog = async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const logs = await AuditLog.find({ restaurantId }).sort({ createdAt: -1 }).limit(500);
    res.render('audit-log', { logs });
  } catch (err) {
    res.status(500).send(err.message);
  }
};
