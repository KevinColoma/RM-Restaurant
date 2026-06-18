const Order = require('../models/order');
const Menu = require('../models/menu');
const { aggregateSales, aggregateOrders } = require('../utils/reportUtils');

const getOrdersInRange = async (start, end) => {
  return Order.find({ createdAt: { $gte: start, $lte: end } }).populate('items.menuItem');
};

const salesByDate = async (req, res) => {
  try {
    const start = new Date(req.query.startDate);
    const end = new Date(req.query.endDate);
    end.setHours(23, 59, 59, 999);
    const orders = await getOrdersInRange(start, end);
    const result = await aggregateSales(orders);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const ordersByDate = async (req, res) => {
  try {
    const start = new Date(req.query.startDate);
    const end = new Date(req.query.endDate);
    end.setHours(23, 59, 59, 999);
    const orderDocs = await getOrdersInRange(start, end);
    const result = await aggregateOrders(orderDocs);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { salesByDate, ordersByDate };
