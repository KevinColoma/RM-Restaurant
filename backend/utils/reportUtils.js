const Order = require('../models/order');

async function aggregateSales(orders) {
  let totalSales = 0;
  let salesByCategory = {};
  let salesBySubCategory = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      const menuItem = item.menuItem;
      if (!menuItem) return;
      const price = menuItem.price;
      const quantity = item.quantity;
      const itemSales = price * quantity;

      totalSales += itemSales;
      salesByCategory[menuItem.category] = (salesByCategory[menuItem.category] || 0) + itemSales;
      salesBySubCategory[menuItem.subCategory] = (salesBySubCategory[menuItem.subCategory] || 0) + itemSales;
    });
  });

  return { totalSales, salesByCategory, salesBySubCategory, numberOfTransactions: orders.length };
}

async function aggregateOrders(orders) {
  let itemCounts = {};
  let totalAmount = 0;
  let orderTypeCounts = { 'dine in': 0, 'take away': 0, 'online': 0 };
  let salesOverTime = {};
  let orderVolumeByHour = new Array(24).fill(0);
  let revenueByOrderType = { dineIn: 0, takeAway: 0, online: 0 };

  orders.forEach(order => {
    const orderDate = order.createdAt.toDateString();
    const orderHour = order.createdAt.getHours();
    orderVolumeByHour[orderHour]++;
    salesOverTime[orderDate] = (salesOverTime[orderDate] || 0) + order.totalAmount;

    if (order.orderType === 'dine in') revenueByOrderType.dineIn += order.totalAmount;
    else if (order.orderType === 'take away') revenueByOrderType.takeAway += order.totalAmount;
    else if (order.orderType === 'online') revenueByOrderType.online += order.totalAmount;

    orderTypeCounts[order.orderType] = (orderTypeCounts[order.orderType] || 0) + 1;
    order.items.forEach(item => {
      if (item.menuItem) {
        itemCounts[item.menuItem.item] = (itemCounts[item.menuItem.item] || 0) + item.quantity;
      }
    });
    totalAmount += order.totalAmount;
  });

  const mostPopularItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);

  return {
    totalOrders: orders.length,
    mostPopularItems,
    averageOrderValue: orders.length > 0 ? totalAmount / orders.length : 0,
    orderTypeCounts,
    salesOverTime,
    orderVolumeByHour,
    revenueByOrderType
  };
}

module.exports = { aggregateSales, aggregateOrders };
