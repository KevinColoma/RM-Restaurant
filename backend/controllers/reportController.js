const Order = require('../models/order');
const Menu = require('../models/menu');
const { aggregateSales, aggregateOrders } = require('../utils/reportUtils');

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getOrdersInRange = async (start, end) => {
  return Order.find({ createdAt: { $gte: start, $lte: end } }).populate('items.menuItem');
};

const sales = async (req, res) => {
  try {
    const { start, end } = todayRange();
    const orders = await getOrdersInRange(start, end);
    const result = await aggregateSales(orders);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const orders = async (req, res) => {
  try {
    const { start, end } = todayRange();
    const orderDocs = await getOrdersInRange(start, end);
    const result = await aggregateOrders(orderDocs);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { sales, orders };
