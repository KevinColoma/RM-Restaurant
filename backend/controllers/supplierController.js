const Supplier = require('../models/Supplier');
const { logAudit } = require('../utils/audit');
const { isValidObjectId } = require('../utils/validate');

exports.createSupplier = async (req, res) => {
    try {
      const personaId = req.personaId;
      const { name, contactInfo } = req.body;

        const newSupplier = new Supplier({
            name, contactInfo, personaId
        });
        await newSupplier.save();
        await logAudit(req, 'create', 'Supplier', newSupplier._id, 'Created supplier: ' + name);
        res.status(201).json(newSupplier);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getSuppliers = async (req, res) => {
  try {
    const personaId = req.personaId;
    const suppliers = await Supplier.find({ personaId });
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const personaId = req.personaId;
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const supplier = await Supplier.findOne({ _id: req.params.id, personaId });
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.status(200).json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const personaId = req.personaId;
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const { name, contactInfo } = req.body;
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, personaId },
      { name, contactInfo },
      { new: true, runValidators: true }
    );
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    await logAudit(req, 'update', 'Supplier', supplier._id, 'Updated supplier: ' + supplier.name);
    res.status(200).json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSuppliersPage = async (req, res) => {
  try {
    const personaId = req.personaId;
    const suppliers = await Supplier.find({ personaId }).sort({ createdAt: -1 });
    res.render('suppliers-list', { suppliers });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const personaId = req.personaId;
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const supplier = await Supplier.findOneAndDelete({ _id: req.params.id, personaId });
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    await logAudit(req, 'delete', 'Supplier', supplier._id, 'Deleted supplier: ' + supplier.name);
    res.status(200).json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
