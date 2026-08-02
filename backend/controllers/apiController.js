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
const { isValidObjectId, escapeRegex } = require('../utils/validate');
const { getPageParams, paginate } = require('../utils/pagination');
const { buildAuditFilter } = require('../utils/auditFilter');

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

const VALID_CATEGORIES = new Set(['Veg', 'Non-Veg']);
const VALID_SUBCATEGORIES = new Set(['Starter', 'Main Course', 'Beverage', 'Soup', 'Salad', 'Roti', 'Rice', 'Dessert', 'Juice', 'Snack', 'Side Dish']);

exports.listMenu = jsonRead(async (req, res) => {
    const filter = { personaId: req.personaId };
    if (VALID_CATEGORIES.has(req.query.category)) filter.category = req.query.category;
    if (VALID_SUBCATEGORIES.has(req.query.subCategory)) filter.subCategory = req.query.subCategory;
    if (req.query.availability === 'true') filter.availability = true;
    else if (req.query.availability === 'false') filter.availability = false;
    if (req.query.q) filter.item = { $regex: escapeRegex(req.query.q), $options: 'i' };
    const result = await paginate(Menu, filter, getPageParams(req), {
        select: '-imageData -imageMime'
    });
    sendPage(res, 'menus', result);
});

exports.listCustomers = jsonRead(async (req, res) => {
    const filter = { personaId: req.personaId };
    if (req.query.q) filter.$or = [
        { name: { $regex: escapeRegex(req.query.q), $options: 'i' } },
        { phone: { $regex: escapeRegex(req.query.q), $options: 'i' } }
    ];
    const result = await paginate(Customer, filter, getPageParams(req), {
        sort: { createdAt: -1 }
    });
    sendPage(res, 'customers', result);
});

exports.listInventory = jsonRead(async (req, res) => {
    const filter = { personaId: req.personaId };
    if (req.query.q) filter.name = { $regex: escapeRegex(req.query.q), $options: 'i' };
    if (req.query.lowStock === 'true') filter.quantity = { $lte: 10 };
    const result = await paginate(InventoryItem, filter, getPageParams(req), {
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
    const filter = { personaId: req.personaId };
    if (req.query.city) filter.city = { $regex: escapeRegex(req.query.city), $options: 'i' };
    if (req.query.q) filter.$or = [
        { restaurantName: { $regex: escapeRegex(req.query.q), $options: 'i' } },
        { city: { $regex: escapeRegex(req.query.q), $options: 'i' } },
        { ownerName: { $regex: escapeRegex(req.query.q), $options: 'i' } }
    ];
    const result = await paginate(Branch, filter, getPageParams(req));
    sendPage(res, 'branches', result);
});

exports.listPurchases = jsonRead(async (req, res) => {
    const filter = { personaId: req.personaId };
    if (req.query.q) filter['items.itemName'] = { $regex: escapeRegex(req.query.q), $options: 'i' };
    const fromDate = parseDate(req.query.dateFrom);
    const toDate = parseDate(req.query.dateTo);
    if (fromDate || toDate) {
        filter.purchaseDate = {};
        if (fromDate) filter.purchaseDate.$gte = fromDate;
        if (toDate) {
            toDate.setHours(23, 59, 59, 999);
            filter.purchaseDate.$lte = toDate;
        }
    }
    const result = await paginate(Purchase, filter, getPageParams(req), {
        sort: { purchaseDate: -1 },
        populate: { path: 'supplier', select: 'name' }
    });
    sendPage(res, 'purchases', result);
});

const VALID_ORDER_TYPES = new Set(['dine in', 'take away', 'online']);

function parseDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

exports.listOrders = jsonRead(async (req, res) => {
    const filter = { personaId: req.personaId };
    const orderType = VALID_ORDER_TYPES.has(req.query.orderType) ? req.query.orderType : null;
    if (orderType) filter.orderType = orderType;
    const fromDate = parseDate(req.query.dateFrom);
    const toDate = parseDate(req.query.dateTo);
    if (fromDate || toDate) {
        filter.createdAt = {};
        if (fromDate) filter.createdAt.$gte = fromDate;
        if (toDate) {
            toDate.setHours(23, 59, 59, 999);
            filter.createdAt.$lte = toDate;
        }
    }
    const result = await paginate(Order, filter, getPageParams(req), {
        sort: { createdAt: -1 },
        populate: { path: 'items.menuItem', select: 'item price' }
    });
    sendPage(res, 'orders', result);
});

// The point-of-sale screen loads its menu and customer pickers in one call.
exports.getPos = jsonRead(async (req, res) => {
    const [menus, customers, persona] = await Promise.all([
        Menu.find({ personaId: req.personaId }).select('-imageData -imageMime'),
        Customer.find({ personaId: req.personaId }).sort({ name: 1 }),
        Persona.findById(req.personaId)
    ]);
    // Same defaults PlaceOrder uses when actually charging the order, so the
    // cart preview the cashier sees always matches what gets billed - see the
    // comment there for why this mirrors it instead of importing it.
    const taxRate = (persona && persona.taxRate != null) ? persona.taxRate : 10;
    const currencySymbol = (persona && persona.currencySymbol) ? persona.currencySymbol : '$';
    res.json({ success: true, menus, customers, taxRate, currencySymbol });
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
    const { action, collection, q, dateFrom, dateTo } = req.query;
    const filter = buildAuditFilter(req.personaId, action, collection, q, dateFrom, dateTo);
    const result = await paginate(AuditLog, filter, getPageParams(req), {
        sort: { createdAt: -1 }
    });
    sendPage(res, 'logs', result);
});
