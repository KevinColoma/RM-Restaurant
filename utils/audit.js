const AuditLog = require('../models/AuditLog');

async function logAudit(req, action, collection, documentId, details, changes) {
  try {
    const restaurantId = req.restaurant ? req.restaurant.restaurantId : null;
    if (!restaurantId) return;

    await AuditLog.create({
      restaurantId,
      action,
      collection,
      documentId: documentId || undefined,
      details: details || '',
      changes: changes || undefined
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { logAudit };
