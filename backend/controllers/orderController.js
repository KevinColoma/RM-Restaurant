const Order = require('../models/order')
const Menu = require('../models/menu')
const Persona = require('../models/Persona')
const { logAudit } = require('../utils/audit');
const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;
const InventoryItem = require('../models/InventoryItem');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');

async function printOrder(order, type, printerConnection) {
  if (!printerConnection) {
    console.log('No printer configured, skipping print');
    return;
  }
  let printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: printerConnection,
  });

  printer.alignCenter();
  printer.bold(true);
  printer.println(type === 'bill' ? 'BILL' : 'KOT');
  printer.bold(false);
  printer.alignLeft();

  order.items.forEach(item => {
    printer.println(`${item.name} x ${item.quantity} - $${item.price}`);
  });

  if (type === 'bill') {
    printer.println('-----------------------------');
    if (order.discount > 0) {
      printer.println(`Discount: -$${order.discount.toFixed(2)}`);
    }
    printer.println(`Total: $${order.totalAmount}`);
  }

  try {
    await printer.execute();
    console.log('Print successful');
  } catch (error) {
    console.error('Print failed:', error);
  }
}
const { isValidObjectId } = require('../utils/validate');

const PlaceOrder = async (req, res) => {
  try {
      const personaId = req.personaId;
      const { items, orderType, comment } = req.body;
      const discountValue = Number(req.body.discount) || 0;
      const discountType = req.body.discountType === 'amount' ? 'amount' : 'percent';

      if (discountValue < 0) {
        return res.status(400).json({ error: 'Discount cannot be negative' });
      }
      if (discountType === 'percent' && discountValue > 100) {
        return res.status(400).json({ error: 'Discount percent cannot exceed 100' });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items must be a non-empty array' });
      }
      for (const item of items) {
        if (!isValidObjectId(item.menuItem)) {
          return res.status(400).json({ error: 'Invalid menuItem ID' });
        }
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          return res.status(400).json({ error: 'Quantity must be a positive number' });
        }
      }

      const persona = await Persona.findById(personaId);
      const taxRate = (persona && persona.taxRate) ? persona.taxRate / 100 : 0.1;
      const currencySymbol = (persona && persona.currencySymbol) ? persona.currencySymbol : '$';
      const printerConnection = (persona && persona.printerConnection) ? persona.printerConnection : '';

      // Load all menus in a single query instead of one per item (removes N+1).
      const menuIds = items.map(i => i.menuItem);
      const menuDocs = await Menu.find({ _id: { $in: menuIds } });
      const menuMap = new Map(menuDocs.map(m => [String(m._id), m]));

      const orderItems = items.map(item => {
          const menuItem = menuMap.get(String(item.menuItem));
          if (!menuItem) {
              throw new Error('Menu item not found: ' + item.menuItem);
          }
          return {
              menuItem: menuItem._id,
              quantity: item.quantity,
              price: menuItem.price * item.quantity
          };
      });

      const subtotal = orderItems.reduce((sum, item) => sum + item.price, 0);
      const tax = subtotal * taxRate;
      const discountAmount = discountValue > 0
        ? (discountType === 'percent' ? subtotal * (Math.min(100, discountValue) / 100) : Math.min(discountValue, subtotal))
        : 0;
      const totalAmount = Math.max(0, subtotal + tax - discountAmount);

      const newOrder = new Order({
          personaId,
          items: orderItems,
          usuarioId: req.usuario ? req.usuario._id : null,
          usuarioName: req.usuario ? req.usuario.username : '',
          totalAmount,
          taxAmount: tax,
          discount: discountAmount,
          orderType,
          comment
      });

      await newOrder.save();
      await logAudit(req, 'create', 'Order', newOrder._id, 'Order placed: ' + orderType + ' - $' + totalAmount.toFixed(2));

      if (req.body.customerId) {
          await Customer.findByIdAndUpdate(req.body.customerId, { $push: { orders: newOrder._id } });
      }

      // Deduct inventory with a single batch update instead of per-item lookups.
      const qtyByName = {};
      for (const oi of orderItems) {
          const menuItem = menuMap.get(String(oi.menuItem));
          if (menuItem) {
              qtyByName[menuItem.item] = (qtyByName[menuItem.item] || 0) + oi.quantity;
          }
      }
      const inventoryNames = Object.keys(qtyByName);
      if (inventoryNames.length > 0) {
          const inventoryItems = await InventoryItem.find({ personaId, name: { $in: inventoryNames } });
          const bulkOps = inventoryItems
              .filter(inv => (qtyByName[inv.name] || 0) > 0)
              .map(inv => ({
                  updateOne: {
                      filter: { _id: inv._id },
                      update: { $inc: { quantity: -(qtyByName[inv.name] || 0) } }
                  }
              }));
          if (bulkOps.length > 0) {
              await InventoryItem.bulkWrite(bulkOps);
          }
      }

      res.status(201).send(newOrder);

      // Print after responding so the confirmation is not blocked by printer I/O.
      setImmediate(() => {
          Promise.all([printOrder(newOrder, 'KOT', printerConnection), printOrder(newOrder, 'bill', printerConnection)])
              .catch(err => console.error('Print failed:', err));
      });
  } catch (error) {
      res.status(400).send(error.message);
  }
};




const VALID_ORDER_TYPES = ['dine in', 'take away', 'online'];

function parseDate(value) {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

const GetOrders = async (req, res) => {
    try {
        const personaId = req.personaId;
        const filter = { personaId };
        // Non-admin users only see the orders they created themselves.
        if (!(req.usuario && req.usuario.isadmin)) {
            filter.usuarioId = req.usuario ? req.usuario._id : null;
        }
        const orderType = VALID_ORDER_TYPES.find(t => t === req.query.orderType);
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
        const orders = await Order.find(filter)
            .populate('items.menuItem', 'item price')
            .sort({ createdAt: -1 });
        res.render('orders-list', { orders, query: req.query });
    } catch (error) {
        res.status(400).send(error.message);
    }
};

exports.deleteOrder = async (req, res) => {
  try {
    const personaId = req.personaId;
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const delFilter = { _id: req.params.id, personaId };
    // Non-admin users can only delete orders they created themselves.
    if (!(req.usuario && req.usuario.isadmin)) {
      delFilter.usuarioId = req.usuario ? req.usuario._id : null;
    }
    const order = await Order.findOneAndDelete(delFilter);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await logAudit(req, 'cancel', 'Order', order._id, 'Order cancelled: ' + order._id);
    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports={ PlaceOrder, GetOrders, deleteOrder: exports.deleteOrder }