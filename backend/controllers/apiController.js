// JSON reads for the SPA.
//
// The controllers next to this one answer the EJS app and reply with rendered
// templates, so the paths the SPA calls matched no route and fell through to
// the production catch-all - which handed back index.html and made every list
// look empty. These expose the same, identically scoped data as JSON without
// disturbing the EJS routes.
//
// Response shape follows what the SPA already reads: { success: true, <key>: [...] }.

const Menu = require('../models/menu');
const Customer = require('../models/Customer');
const InventoryItem = require('../models/InventoryItem');
const Supplier = require('../models/Supplier');
const Branch = require('../models/branchRestaurant');
const Purchase = require('../models/Purchase');
const Order = require('../models/order');
const Persona = require('../models/Persona');
const AuditLog = require('../models/AuditLog');
const { isValidObjectId } = require('../utils/validate');

// Wraps a read so every endpoint reports failure the same way, and a thrown
// error can never leak a stack trace to the client.
const jsonRead = (handler) => async (req, res) => {
    try {
        await handler(req, res);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.listMenu = jsonRead(async (req, res) => {
    const menus = await Menu.find({ personaId: req.personaId });
    res.json({ success: true, menus });
});

exports.listCustomers = jsonRead(async (req, res) => {
    const customers = await Customer.find({ personaId: req.personaId }).sort({ createdAt: -1 });
    res.json({ success: true, customers });
});

exports.listInventory = jsonRead(async (req, res) => {
    const inventoryItems = await InventoryItem.find({ personaId: req.personaId })
        .populate('supplier', 'name');
    res.json({ success: true, inventoryItems });
});

// The edit screen needs the item plus the supplier list to build its dropdown.
exports.getInventoryItem = jsonRead(async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, error: 'Invalid ID' });
    }
    const item = await InventoryItem.findOne({ _id: req.params.id, personaId: req.personaId });
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    const suppliers = await Supplier.find({ personaId: req.personaId });
    res.json({ success: true, item, suppliers });
});

exports.listBranches = jsonRead(async (req, res) => {
    const branches = await Branch.find({ personaId: req.personaId });
    res.json({ success: true, branches });
});

exports.listPurchases = jsonRead(async (req, res) => {
    const purchases = await Purchase.find({ personaId: req.personaId })
        .populate('supplier', 'name')
        .sort({ purchaseDate: -1 });
    res.json({ success: true, purchases });
});

exports.listOrders = jsonRead(async (req, res) => {
    const orders = await Order.find({ personaId: req.personaId })
        .populate('items.menuItem', 'item price')
        .sort({ createdAt: -1 });
    res.json({ success: true, orders });
});

// The point-of-sale screen loads its menu and customer pickers in one call.
exports.getPos = jsonRead(async (req, res) => {
    const menus = await Menu.find({ personaId: req.personaId });
    const customers = await Customer.find({ personaId: req.personaId }).sort({ name: 1 });
    res.json({ success: true, menus, customers });
});

exports.getProfile = jsonRead(async (req, res) => {
    const persona = await Persona.findById(req.personaId);
    if (!persona) return res.status(404).json({ success: false, error: 'Persona not found' });
    res.json({
        success: true,
        persona,
        avatarUrl: persona.avatar || '/uploads/avatar-' + req.personaId + '.png',
        // Flat copies for the header, which reads these directly.
        ownerName: persona.ownerName,
        restaurantName: persona.restaurantName,
        avatar: persona.avatar || ''
    });
});

exports.getSettings = jsonRead(async (req, res) => {
    const persona = await Persona.findById(req.personaId);
    if (!persona) return res.status(404).json({ success: false, error: 'Persona not found' });
    res.json({ success: true, persona });
});

exports.listAuditLog = jsonRead(async (req, res) => {
    const logs = await AuditLog.find({ personaId: req.personaId })
        .sort({ createdAt: -1 })
        .limit(500);
    res.json({ success: true, logs });
});
