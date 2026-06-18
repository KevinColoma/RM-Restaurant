const AuditLog = require('../models/AuditLog');

async function logAudit(req, action, collection, documentId, details, changes) {
  try {
    const personaId = req.personaId || null;
    if (!personaId) return;

    await AuditLog.create({
      personaId,
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
