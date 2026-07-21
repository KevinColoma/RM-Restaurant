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
const { getPageParams, paginate } = require('../utils/pagination');

// Wraps a read so every endpoint reports failure the same way, and a thrown
// error can never leak a stack trace to the client.
const jsonRead = (handler) => async (req, res) => {
    try {
        await handler(req, res);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Sends one page under the key the SPA reads, alongside the totals its
// pagination controls need. Keeping the list under its original key means an
// older client still renders - it just sees the first page instead of
// everything, which is the point.
const sendPage = (res, key, result) => res.json({
    success: true,
    [key]: result.items,
    total: result.total,
    page: result.page,
    pages: result.pages,
    limit: result.limit
});

exports.listMenu = jsonRead(async (req, res) => {
    const result = await paginate(Menu, { personaId: req.personaId }, getPageParams(req));
    sendPage(res, 'menus', result);
});

exports.listCustomers = jsonRead(async (req, res) => {
    const result = await paginate(Customer, { personaId: req.personaId }, getPageParams(req), {
        sort: { createdAt: -1 }
    });
    sendPage(res, 'customers', result);
});

exports.listInventory = jsonRead(async (req, res) => {
    const result = await paginate(InventoryItem, { personaId: req.personaId }, getPageParams(req), {
        populate: { path: 'supplier', select: 'name' }
    });
    sendPage(res, 'inventoryItems', result);
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
    const result = await paginate(Branch, { personaId: req.personaId }, getPageParams(req));
    sendPage(res, 'branches', result);
});

exports.listPurchases = jsonRead(async (req, res) => {
    const result = await paginate(Purchase, { personaId: req.personaId }, getPageParams(req), {
        sort: { purchaseDate: -1 },
        populate: { path: 'supplier', select: 'name' }
    });
    sendPage(res, 'purchases', result);
});

exports.listOrders = jsonRead(async (req, res) => {
    const result = await paginate(Order, { personaId: req.personaId }, getPageParams(req), {
        sort: { createdAt: -1 },
        populate: { path: 'items.menuItem', select: 'item price' }
    });
    sendPage(res, 'orders', result);
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
    const result = await paginate(AuditLog, { personaId: req.personaId }, getPageParams(req), {
        sort: { createdAt: -1 }
    });
    sendPage(res, 'logs', result);
});
