const Order = require('../models/order');
const Menu = require('../models/menu');
const { aggregateSales, aggregateOrders } = require('../utils/reportUtils');

const getOrdersInRange = async (start, end, personaId) => {
  const filter = { createdAt: { $gte: start, $lte: end } };
  if (personaId) filter.personaId = personaId;
  return Order.find(filter).populate('items.menuItem');
};

const salesByDate = async (req, res) => {
  try {
    const personaId = req.personaId;
    const start = new Date(req.query.startDate);
    const end = new Date(req.query.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    end.setHours(23, 59, 59, 999);
    const orders = await getOrdersInRange(start, end, personaId);
    const result = await aggregateSales(orders);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const ordersByDate = async (req, res) => {
  try {
    const personaId = req.personaId;
    const start = new Date(req.query.startDate);
    const end = new Date(req.query.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    end.setHours(23, 59, 59, 999);
    const orderDocs = await getOrdersInRange(start, end, personaId);
    const result = await aggregateOrders(orderDocs);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { salesByDate, ordersByDate };
