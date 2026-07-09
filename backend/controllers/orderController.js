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

      const orderItems = await Promise.all(items.map(async item => {
          const menuItem = await Menu.findById(item.menuItem);
          return {
              menuItem: menuItem._id,
              quantity: item.quantity,
              price: menuItem.price * item.quantity
          };
      }));

      const subtotal = orderItems.reduce((sum, item) => sum + item.price, 0);
      const tax = subtotal * taxRate;
      const totalAmount = subtotal + tax;

      const newOrder = new Order({
          personaId,
          items: orderItems,
          totalAmount,
          taxAmount: tax,
          orderType,
          comment
      });

      await newOrder.save();
      await logAudit(req, 'create', 'Order', newOrder._id, 'Order placed: ' + orderType + ' - $' + totalAmount.toFixed(2));

      if (req.body.customerId) {
          await Customer.findByIdAndUpdate(req.body.customerId, { $push: { orders: newOrder._id } });
      }

      for (const item of orderItems) {
          const menuItem = await Menu.findById(item.menuItem);
          if (menuItem) {
              const inventoryItem = await InventoryItem.findOne({ name: menuItem.item, personaId });
              if (inventoryItem) {
                  inventoryItem.quantity -= item.quantity;
                  await inventoryItem.save();
              } else {
                  console.warn(`Inventory item not found for menu item: ${menuItem.item}`);
              }
          }
      }

      await printOrder(newOrder, 'KOT', printerConnection);
      await printOrder(newOrder, 'bill', printerConnection);

      res.status(201).send(newOrder);
  } catch (error) {
      res.status(400).send(error.message);
  }
};




const GetOrders = async (req, res) => {
    try {
        const personaId = req.personaId;
        const orders = await Order.find({ personaId })
            .populate('items.menuItem', 'item price')
            .sort({ createdAt: -1 });
        res.render('orders-list', { orders });
    } catch (error) {
        res.status(400).send(error.message);
    }
};

exports.deleteOrder = async (req, res) => {
  try {
    const personaId = req.personaId;
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const order = await Order.findOneAndDelete({ _id: req.params.id, personaId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await logAudit(req, 'cancel', 'Order', order._id, 'Order cancelled: ' + order._id);
    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports={ PlaceOrder, GetOrders, deleteOrder: exports.deleteOrder }