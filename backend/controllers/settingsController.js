const Persona = require('../models/Persona');
const { logAudit } = require('../utils/audit');

exports.getSettings = async (req, res) => {
  try {
    const persona = await Persona.findById(req.personaId);
    if (!persona) return res.status(404).send('Persona not found');
    res.render('settings', { persona });
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

    const persona = await Persona.findByIdAndUpdate(
      req.personaId,
      update,
      { new: true, runValidators: true }
    );
    if (!persona) return res.status(404).json({ error: 'Persona not found' });
    await logAudit(req, 'settings_update', 'Persona', persona._id, 'Settings updated: taxRate=' + taxRate + ', currency=' + currencySymbol + ', theme=' + theme);
    res.json({ success: true, persona });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
