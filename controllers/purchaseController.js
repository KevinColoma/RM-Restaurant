const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const InventoryItem = require('../models/InventoryItem');
const { logAudit } = require('../utils/audit');

exports.listPurchases = async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const purchases = await Purchase.find({ restaurantId })
      .populate('supplier', 'name')
      .sort({ purchaseDate: -1 });
    res.render('purchase-list', { purchases });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.addPurchasePage = async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const suppliers = await Supplier.find({ restaurantId });
    const inventoryItems = await InventoryItem.find({ restaurantId });
    res.render('add-purchase', { suppliers, inventoryItems });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.createPurchase = async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const { supplier, items, purchaseDate, notes } = req.body;

    const parsedItems = items.map(item => ({
      itemName: item.itemName,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.quantity) * Number(item.unitPrice)
    }));

    const totalAmount = parsedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const purchase = new Purchase({
      restaurantId,
      supplier,
      items: parsedItems,
      totalAmount,
      purchaseDate: purchaseDate || new Date(),
      notes: notes || ''
    });

    await purchase.save();
    await logAudit(req, 'create', 'Purchase', purchase._id, 'Purchase created: $' + totalAmount.toFixed(2) + ' - ' + parsedItems.length + ' items');

    for (const item of parsedItems) {
      const invItem = await InventoryItem.findOne({ name: item.itemName, restaurantId });
      if (invItem) {
        invItem.quantity += item.quantity;
        await invItem.save();
      }
    }

    res.status(201).json(purchase);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findOne({
      _id: req.params.id,
      restaurantId: req.restaurant.restaurantId
    }).populate('supplier', 'name');
    if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
    res.json(purchase);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.restaurant.restaurantId
    });
    if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
    await logAudit(req, 'delete', 'Purchase', purchase._id, 'Purchase deleted: $' + purchase.totalAmount.toFixed(2));
    res.json({ message: 'Purchase deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
