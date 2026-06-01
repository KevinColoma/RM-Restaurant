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

// Menu exports
exports.exportMenuCsv = async (req, res) => {
  try {
    const items = await Menu.find({ restaurantId: req.restaurant.restaurantId });
    const columns = [
      { label: 'Item Name', getValue: r => r.item },
      { label: 'Category', getValue: r => r.category },
      { label: 'Sub Category', getValue: r => r.subCategory },
      { label: 'Price', getValue: r => r.price.toFixed(2) },
      { label: 'Available', getValue: r => r.availability ? 'Yes' : 'No' },
    ];
    const csv = generateCsv(items, columns);
    setCsvHeaders(res, 'menu-items.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.exportMenuPdf = async (req, res) => {
  try {
    const items = await Menu.find({ restaurantId: req.restaurant.restaurantId });
    const columns = [
      { label: 'Item', getValue: r => r.item },
      { label: 'Category', getValue: r => r.category },
      { label: 'Sub Category', getValue: r => r.subCategory },
      { label: 'Price', getValue: r => r.price.toFixed(2) },
    ];
    const doc = generatePdf('Menu Items', items, columns);
    setPdfHeaders(res, 'menu-items.pdf');
    doc.pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Orders exports
exports.exportOrdersCsv = async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.restaurant.restaurantId })
      .populate('items.menuItem', 'item')
      .sort({ createdAt: -1 });
    const columns = [
      { label: 'Order ID', getValue: r => r._id },
      { label: 'Items', getValue: r => r.items.map(i => i.menuItem ? i.menuItem.item : 'N/A').join('; ') },
      { label: 'Order Type', getValue: r => r.orderType },
      { label: 'Total', getValue: r => r.totalAmount.toFixed(2) },
      { label: 'Tax', getValue: r => r.taxAmount.toFixed(2) },
      { label: 'Date', getValue: r => new Date(r.createdAt).toLocaleDateString() },
    ];
    const csv = generateCsv(orders, columns);
    setCsvHeaders(res, 'orders.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.exportOrdersPdf = async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.restaurant.restaurantId })
      .populate('items.menuItem', 'item')
      .sort({ createdAt: -1 });
    const columns = [
      { label: 'Order ID', getValue: r => String(r._id).slice(-8) },
      { label: 'Items', getValue: r => r.items.map(i => i.menuItem ? i.menuItem.item : 'N/A').join(', ') },
      { label: 'Type', getValue: r => r.orderType },
      { label: 'Total', getValue: r => r.totalAmount.toFixed(2) },
      { label: 'Date', getValue: r => new Date(r.createdAt).toLocaleDateString() },
    ];
    const doc = generatePdf('Orders Report', orders, columns);
    setPdfHeaders(res, 'orders.pdf');
    doc.pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Customer exports
exports.exportCustomersCsv = async (req, res) => {
  try {
    const customers = await Customer.find({ restaurantId: req.restaurant.restaurantId }).sort({ createdAt: -1 });
    const columns = [
      { label: 'Name', getValue: r => r.name },
      { label: 'Phone', getValue: r => r.phone },
      { label: 'Address', getValue: r => r.address },
      { label: 'Created', getValue: r => new Date(r.createdAt).toLocaleDateString() },
    ];
    const csv = generateCsv(customers, columns);
    setCsvHeaders(res, 'customers.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.exportCustomersPdf = async (req, res) => {
  try {
    const customers = await Customer.find({ restaurantId: req.restaurant.restaurantId }).sort({ createdAt: -1 });
    const columns = [
      { label: 'Name', getValue: r => r.name },
      { label: 'Phone', getValue: r => r.phone },
      { label: 'Address', getValue: r => r.address },
      { label: 'Date', getValue: r => new Date(r.createdAt).toLocaleDateString() },
    ];
    const doc = generatePdf('Customers List', customers, columns);
    setPdfHeaders(res, 'customers.pdf');
    doc.pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Expense exports
exports.exportExpensesCsv = async (req, res) => {
  try {
    const expenses = await Expense.find({ restaurantId: req.restaurant.restaurantId }).sort({ expenseDate: -1 });
    const columns = [
      { label: 'Type', getValue: r => r.expenseType },
      { label: 'Date', getValue: r => new Date(r.expenseDate).toLocaleDateString() },
      { label: 'Amount', getValue: r => r.amount.toFixed(2) },
      { label: 'Vendor', getValue: r => r.vendor || '' },
      { label: 'Description', getValue: r => r.description },
    ];
    const csv = generateCsv(expenses, columns);
    setCsvHeaders(res, 'expenses.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.exportExpensesPdf = async (req, res) => {
  try {
    const expenses = await Expense.find({ restaurantId: req.restaurant.restaurantId }).sort({ expenseDate: -1 });
    const columns = [
      { label: 'Type', getValue: r => r.expenseType },
      { label: 'Date', getValue: r => new Date(r.expenseDate).toLocaleDateString() },
      { label: 'Amount', getValue: r => r.amount.toFixed(2) },
      { label: 'Vendor', getValue: r => r.vendor || '' },
    ];
    const doc = generatePdf('Expenses List', expenses, columns);
    setPdfHeaders(res, 'expenses.pdf');
    doc.pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Inventory exports
exports.exportInventoryCsv = async (req, res) => {
  try {
    const items = await InventoryItem.find({ restaurantId: req.restaurant.restaurantId }).populate('supplier', 'name');
    const columns = [
      { label: 'Item Name', getValue: r => r.name },
      { label: 'Quantity', getValue: r => r.quantity },
      { label: 'Price', getValue: r => r.price.toFixed(2) },
      { label: 'Supplier', getValue: r => r.supplier ? r.supplier.name : '' },
    ];
    const csv = generateCsv(items, columns);
    setCsvHeaders(res, 'inventory.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.exportInventoryPdf = async (req, res) => {
  try {
    const items = await InventoryItem.find({ restaurantId: req.restaurant.restaurantId }).populate('supplier', 'name');
    const columns = [
      { label: 'Item', getValue: r => r.name },
      { label: 'Qty', getValue: r => r.quantity },
      { label: 'Price', getValue: r => r.price.toFixed(2) },
      { label: 'Supplier', getValue: r => r.supplier ? r.supplier.name : '' },
    ];
    const doc = generatePdf('Inventory List', items, columns);
    setPdfHeaders(res, 'inventory.pdf');
    doc.pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Branch exports
exports.exportBranchesCsv = async (req, res) => {
  try {
    const branches = await Branch.find({ restaurantID: req.restaurant.restaurantId });
    const columns = [
      { label: 'Restaurant Name', getValue: r => r.restaurantName },
      { label: 'Owner', getValue: r => r.ownerName },
      { label: 'City', getValue: r => r.city },
      { label: 'Address', getValue: r => r.address },
      { label: 'Email', getValue: r => r.email },
      { label: 'Mobile', getValue: r => r.mobile },
    ];
    const csv = generateCsv(branches, columns);
    setCsvHeaders(res, 'branches.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.exportBranchesPdf = async (req, res) => {
  try {
    const branches = await Branch.find({ restaurantID: req.restaurant.restaurantId });
    const columns = [
      { label: 'Restaurant', getValue: r => r.restaurantName },
      { label: 'Owner', getValue: r => r.ownerName },
      { label: 'City', getValue: r => r.city },
      { label: 'Email', getValue: r => r.email },
      { label: 'Mobile', getValue: r => r.mobile },
    ];
    const doc = generatePdf('Branches List', branches, columns);
    setPdfHeaders(res, 'branches.pdf');
    doc.pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Supplier exports
exports.exportSuppliersCsv = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ restaurantId: req.restaurant.restaurantId });
    const columns = [
      { label: 'Name', getValue: r => r.name },
      { label: 'Contact Info', getValue: r => r.contactInfo },
    ];
    const csv = generateCsv(suppliers, columns);
    setCsvHeaders(res, 'suppliers.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.exportSuppliersPdf = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ restaurantId: req.restaurant.restaurantId });
    const columns = [
      { label: 'Name', getValue: r => r.name },
      { label: 'Contact', getValue: r => r.contactInfo },
    ];
    const doc = generatePdf('Suppliers List', suppliers, columns);
    setPdfHeaders(res, 'suppliers.pdf');
    doc.pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Sales report exports
exports.exportSalesCsv = async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let query = { restaurantId, createdAt: { $gte: startOfDay, $lte: endOfDay } };
    if (req.query.startDate && req.query.endDate) {
      query = {
        restaurantId,
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
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.exportSalesPdf = async (req, res) => {
  try {
    const restaurantId = req.restaurant.restaurantId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let query = { restaurantId, createdAt: { $gte: startOfDay, $lte: endOfDay } };
    if (req.query.startDate && req.query.endDate) {
      query = {
        restaurantId,
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
    const doc = generatePdf('Sales Report', orders, columns);
    setPdfHeaders(res, 'sales-report.pdf');
    doc.pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Purchase exports
exports.exportPurchasesCsv = async (req, res) => {
  try {
    const purchases = await Purchase.find({ restaurantId: req.restaurant.restaurantId })
      .populate('supplier', 'name')
      .sort({ purchaseDate: -1 });
    const columns = [
      { label: 'Date', getValue: r => new Date(r.purchaseDate).toLocaleDateString() },
      { label: 'Supplier', getValue: r => r.supplier ? r.supplier.name : '' },
      { label: 'Items', getValue: r => r.items.map(i => i.itemName + ' x' + i.quantity).join('; ') },
      { label: 'Total Amount', getValue: r => r.totalAmount.toFixed(2) },
      { label: 'Notes', getValue: r => r.notes || '' },
    ];
    const csv = generateCsv(purchases, columns);
    setCsvHeaders(res, 'purchases.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.exportPurchasesPdf = async (req, res) => {
  try {
    const purchases = await Purchase.find({ restaurantId: req.restaurant.restaurantId })
      .populate('supplier', 'name')
      .sort({ purchaseDate: -1 });
    const columns = [
      { label: 'Date', getValue: r => new Date(r.purchaseDate).toLocaleDateString() },
      { label: 'Supplier', getValue: r => r.supplier ? r.supplier.name : '' },
      { label: 'Total', getValue: r => r.totalAmount.toFixed(2) },
      { label: 'Notes', getValue: r => r.notes || '' },
    ];
    const doc = generatePdf('Purchases List', purchases, columns);
    setPdfHeaders(res, 'purchases.pdf');
    doc.pipe(res);
  } catch (err) {
    res.status(500).send(err.message);
  }
};
