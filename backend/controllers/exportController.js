const Menu = require('../models/menu');
const Order = require('../models/order');
const Customer = require('../models/Customer');
const Expense = require('../models/Expense');
const InventoryItem = require('../models/InventoryItem');
const Branch = require('../models/branchRestaurant');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const { generateCsv } = require('../utils/csv');
const { generatePdf } = require('../utils/pdf');

function setCsvHeaders(res, filename) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
}

function setPdfHeaders(res, filename) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
}

function csvExport(model, opts) {
  return async (req, res) => {
    try {
      const query = model.find({ personaId: req.personaId });
      if (opts.sort) query.sort(opts.sort);
      if (opts.populate) query.populate(opts.populate);
      const items = await query;
      const csv = generateCsv(items, opts.columns);
      setCsvHeaders(res, opts.filename);
      res.send(csv);
    } catch (err) { res.status(500).send(err.message); }
  };
}

function pdfExport(model, opts) {
  return async (req, res) => {
    try {
      const query = model.find({ personaId: req.personaId });
      if (opts.sort) query.sort(opts.sort);
      if (opts.populate) query.populate(opts.populate);
      const items = await query;
      const doc = generatePdf(opts.title, items, opts.columns, {
        restaurantName: req.usuario?.personaId?.restaurantName
      });
      setPdfHeaders(res, opts.filename);
      doc.pipe(res);
    } catch (err) { res.status(500).send(err.message); }
  };
}

// Menu exports
exports.exportMenuCsv = csvExport(Menu, {
  columns: [
    { label: 'Item Name', getValue: r => r.item },
    { label: 'Category', getValue: r => r.category },
    { label: 'Sub Category', getValue: r => r.subCategory },
    { label: 'Price', getValue: r => r.price.toFixed(2) },
    { label: 'Available', getValue: r => r.availability ? 'Yes' : 'No' },
  ],
  filename: 'menu-items.csv'
});

exports.exportMenuPdf = pdfExport(Menu, {
  columns: [
    { label: 'Item', getValue: r => r.item },
    { label: 'Category', getValue: r => r.category },
    { label: 'Sub Category', getValue: r => r.subCategory },
    { label: 'Price', getValue: r => r.price.toFixed(2) },
  ],
  title: 'Menu Items',
  filename: 'menu-items.pdf'
});

// Orders exports
exports.exportOrdersCsv = csvExport(Order, {
  populate: { path: 'items.menuItem', select: 'item' },
  sort: { createdAt: -1 },
  columns: [
    { label: 'Order ID', getValue: r => r._id },
    { label: 'Items', getValue: r => r.items.map(i => i.menuItem ? i.menuItem.item : 'N/A').join('; ') },
    { label: 'Order Type', getValue: r => r.orderType },
    { label: 'Total', getValue: r => r.totalAmount.toFixed(2) },
    { label: 'Tax', getValue: r => r.taxAmount.toFixed(2) },
    { label: 'Date', getValue: r => new Date(r.createdAt).toLocaleDateString() },
  ],
  filename: 'orders.csv'
});

exports.exportOrdersPdf = pdfExport(Order, {
  populate: { path: 'items.menuItem', select: 'item' },
  sort: { createdAt: -1 },
  columns: [
    { label: 'Order ID', getValue: r => String(r._id).slice(-8) },
    { label: 'Items', getValue: r => r.items.map(i => i.menuItem ? i.menuItem.item : 'N/A').join(', ') },
    { label: 'Type', getValue: r => r.orderType },
    { label: 'Total', getValue: r => r.totalAmount.toFixed(2) },
    { label: 'Date', getValue: r => new Date(r.createdAt).toLocaleDateString() },
  ],
  title: 'Orders Report',
  filename: 'orders.pdf'
});

// Customer exports
exports.exportCustomersCsv = csvExport(Customer, {
  sort: { createdAt: -1 },
  columns: [
    { label: 'Name', getValue: r => r.name },
    { label: 'Phone', getValue: r => r.phone },
    { label: 'Address', getValue: r => r.address },
    { label: 'Created', getValue: r => new Date(r.createdAt).toLocaleDateString() },
  ],
  filename: 'customers.csv'
});

exports.exportCustomersPdf = pdfExport(Customer, {
  sort: { createdAt: -1 },
  columns: [
    { label: 'Name', getValue: r => r.name },
    { label: 'Phone', getValue: r => r.phone },
    { label: 'Address', getValue: r => r.address },
    { label: 'Date', getValue: r => new Date(r.createdAt).toLocaleDateString() },
  ],
  title: 'Customers List',
  filename: 'customers.pdf'
});

// Expense exports
exports.exportExpensesCsv = csvExport(Expense, {
  sort: { expenseDate: -1 },
  columns: [
    { label: 'Type', getValue: r => r.expenseType },
    { label: 'Date', getValue: r => new Date(r.expenseDate).toLocaleDateString() },
    { label: 'Amount', getValue: r => r.amount.toFixed(2) },
    { label: 'Vendor', getValue: r => r.vendor || '' },
    { label: 'Description', getValue: r => r.description },
  ],
  filename: 'expenses.csv'
});

exports.exportExpensesPdf = pdfExport(Expense, {
  sort: { expenseDate: -1 },
  columns: [
    { label: 'Type', getValue: r => r.expenseType },
    { label: 'Date', getValue: r => new Date(r.expenseDate).toLocaleDateString() },
    { label: 'Amount', getValue: r => r.amount.toFixed(2) },
    { label: 'Vendor', getValue: r => r.vendor || '' },
  ],
  title: 'Expenses List',
  filename: 'expenses.pdf'
});

// Inventory exports
exports.exportInventoryCsv = csvExport(InventoryItem, {
  populate: { path: 'supplier', select: 'name' },
  columns: [
    { label: 'Item Name', getValue: r => r.name },
    { label: 'Quantity', getValue: r => r.quantity },
    { label: 'Price', getValue: r => r.price.toFixed(2) },
    { label: 'Supplier', getValue: r => r.supplier ? r.supplier.name : '' },
  ],
  filename: 'inventory.csv'
});

exports.exportInventoryPdf = pdfExport(InventoryItem, {
  populate: { path: 'supplier', select: 'name' },
  columns: [
    { label: 'Item', getValue: r => r.name },
    { label: 'Qty', getValue: r => r.quantity },
    { label: 'Price', getValue: r => r.price.toFixed(2) },
    { label: 'Supplier', getValue: r => r.supplier ? r.supplier.name : '' },
  ],
  title: 'Inventory List',
  filename: 'inventory.pdf'
});

// Branch exports
exports.exportBranchesCsv = csvExport(Branch, {
  columns: [
    { label: 'Restaurant Name', getValue: r => r.restaurantName },
    { label: 'Owner', getValue: r => r.ownerName },
    { label: 'City', getValue: r => r.city },
    { label: 'Address', getValue: r => r.address },
    { label: 'Email', getValue: r => r.email },
    { label: 'Mobile', getValue: r => r.mobile },
  ],
  filename: 'branches.csv'
});

exports.exportBranchesPdf = pdfExport(Branch, {
  columns: [
    { label: 'Restaurant', getValue: r => r.restaurantName },
    { label: 'Owner', getValue: r => r.ownerName },
    { label: 'City', getValue: r => r.city },
    { label: 'Email', getValue: r => r.email },
    { label: 'Mobile', getValue: r => r.mobile },
  ],
  title: 'Branches List',
  filename: 'branches.pdf'
});

// Supplier exports
exports.exportSuppliersCsv = csvExport(Supplier, {
  columns: [
    { label: 'Name', getValue: r => r.name },
    { label: 'Contact Info', getValue: r => r.contactInfo },
  ],
  filename: 'suppliers.csv'
});

exports.exportSuppliersPdf = pdfExport(Supplier, {
  columns: [
    { label: 'Name', getValue: r => r.name },
    { label: 'Contact', getValue: r => r.contactInfo },
  ],
  title: 'Suppliers List',
  filename: 'suppliers.pdf'
});

// Sales report exports (special — has date range logic)
exports.exportSalesCsv = async (req, res) => {
  try {
    const personaId = req.personaId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let query = { personaId, createdAt: { $gte: startOfDay, $lte: endOfDay } };
    if (req.query.startDate && req.query.endDate) {
      query = {
        personaId,
        createdAt: {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate + 'T23:59:59.999Z'),
        },
      };
    }

    const orders = await Order.find(query).populate('items.menuItem', 'item').sort({ createdAt: -1 });
    const columns = [
      { label: 'Order ID', getValue: r => r._id },
      { label: 'Items', getValue: r => r.items.map(i => i.menuItem ? i.menuItem.item : 'N/A').join('; ') },
      { label: 'Type', getValue: r => r.orderType },
      { label: 'Subtotal', getValue: r => (r.totalAmount - r.taxAmount).toFixed(2) },
      { label: 'Tax', getValue: r => r.taxAmount.toFixed(2) },
      { label: 'Total', getValue: r => r.totalAmount.toFixed(2) },
      { label: 'Date', getValue: r => new Date(r.createdAt).toLocaleString() },
    ];
    const csv = generateCsv(orders, columns);
    setCsvHeaders(res, 'sales-report.csv');
    res.send(csv);
  } catch (err) { res.status(500).send(err.message); }
};

exports.exportSalesPdf = async (req, res) => {
  try {
    const personaId = req.personaId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let query = { personaId, createdAt: { $gte: startOfDay, $lte: endOfDay } };
    if (req.query.startDate && req.query.endDate) {
      query = {
        personaId,
        createdAt: {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate + 'T23:59:59.999Z'),
        },
      };
    }

    const orders = await Order.find(query).populate('items.menuItem', 'item').sort({ createdAt: -1 });
    const columns = [
      { label: 'Order ID', getValue: r => String(r._id).slice(-8) },
      { label: 'Items', getValue: r => r.items.map(i => i.menuItem ? i.menuItem.item : 'N/A').join(', ') },
      { label: 'Type', getValue: r => r.orderType },
      { label: 'Total', getValue: r => r.totalAmount.toFixed(2) },
      { label: 'Date', getValue: r => new Date(r.createdAt).toLocaleDateString() },
    ];
    const doc = generatePdf('Sales Report', orders, columns, {
      restaurantName: req.usuario?.personaId?.restaurantName
    });
    setPdfHeaders(res, 'sales-report.pdf');
    doc.pipe(res);
  } catch (err) { res.status(500).send(err.message); }
};

// Purchase exports
exports.exportPurchasesCsv = csvExport(Purchase, {
  populate: { path: 'supplier', select: 'name' },
  sort: { purchaseDate: -1 },
  columns: [
    { label: 'Date', getValue: r => new Date(r.purchaseDate).toLocaleDateString() },
    { label: 'Supplier', getValue: r => r.supplier ? r.supplier.name : '' },
    { label: 'Items', getValue: r => r.items.map(i => i.itemName + ' x' + i.quantity).join('; ') },
    { label: 'Total Amount', getValue: r => r.totalAmount.toFixed(2) },
    { label: 'Notes', getValue: r => r.notes || '' },
  ],
  filename: 'purchases.csv'
});

exports.exportPurchasesPdf = pdfExport(Purchase, {
  populate: { path: 'supplier', select: 'name' },
  sort: { purchaseDate: -1 },
  columns: [
    { label: 'Date', getValue: r => new Date(r.purchaseDate).toLocaleDateString() },
    { label: 'Supplier', getValue: r => r.supplier ? r.supplier.name : '' },
    { label: 'Total', getValue: r => r.totalAmount.toFixed(2) },
    { label: 'Notes', getValue: r => r.notes || '' },
  ],
  title: 'Purchases List',
  filename: 'purchases.pdf'
});
