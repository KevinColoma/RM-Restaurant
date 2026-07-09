const InventoryItem = require('../models/InventoryItem');
const Supplier = require('../models/Supplier')
const { logAudit } = require('../utils/audit');
const { isValidObjectId } = require('../utils/validate');


exports.addInventory = async (req,res)=>{
    try {
        const personaId = req.personaId;
        const suppliers = await Supplier.find({ personaId });
        res.render('add-inventory', { suppliers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

}

exports.addItem = async (req, res) => {
    try {
      const personaId = req.personaId;
      
      const { name, quantity, price, supplier } = req.body;
      const newItem = new InventoryItem({ name, quantity, price, supplier, personaId });
      
      await newItem.save();
      await logAudit(req, 'create', 'InventoryItem', newItem._id, 'Created inventory item: ' + req.body.name);
      res.status(201).json(newItem);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  
  exports.getItem = async (req, res) => {
    try {
      const personaId = req.personaId;

        const inventoryItems = await InventoryItem.find({ personaId })
            .populate('supplier', 'name'); // Optionally populate the supplier field

        res.render('inventory-list',{inventoryItems});
    } catch (error) {
        console.error('Error fetching inventory items:', error);
        res.status(500).json({ message: 'Server error' });
    }
  };
  

  exports.updateItem = async (req, res) => {
    try {
      const personaId = req.personaId;
      const { name, quantity, price, supplier } = req.body;
      if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
      const item = await InventoryItem.findOneAndUpdate(
        { _id: req.params.id, personaId },
        { name, quantity, price, supplier },
        { new: true, runValidators: true }
      );
      if (!item) return res.status(404).json({ error: 'Inventory item not found' });
      await logAudit(req, 'update', 'InventoryItem', item._id, 'Updated inventory item: ' + item.name);
      res.json(item);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };

  exports.deleteInventory = async (req, res) => {
    try {
        const personaId = req.personaId;
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
        const item = await InventoryItem.findOneAndDelete({ _id: req.params.id, personaId });
        if (!item) return res.status(404).json({ error: 'Inventory item not found' });
        await logAudit(req, 'delete', 'InventoryItem', item._id, 'Deleted inventory item: ' + item.name);
        res.json({ message: 'Inventory deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
}