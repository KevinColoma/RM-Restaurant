const AuditLog = require('../models/AuditLog');

exports.getAuditLog = async (req, res) => {
  try {
    const personaId = req.personaId;
    const logs = await AuditLog.find({ personaId }).sort({ createdAt: -1 }).limit(500);
    res.render('audit-log', { logs });
  } catch (err) {
    res.status(500).send(err.message);
  }
};
