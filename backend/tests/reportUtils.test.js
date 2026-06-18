const { aggregateSales, aggregateOrders } = require('../utils/reportUtils');

describe('reportUtils', () => {
  describe('aggregateSales', () => {
    it('returns zeros for empty orders', async () => {
      const result = await aggregateSales([]);
      expect(result).toEqual({
        totalSales: 0,
        salesByCategory: {},
        salesBySubCategory: {},
        numberOfTransactions: 0
      });
    });

    it('aggregates sales from order items', async () => {
      const orders = [{
        items: [
          { menuItem: { price: 10, category: 'Food', subCategory: 'Pizza' }, quantity: 2 },
          { menuItem: { price: 5, category: 'Drink', subCategory: 'Soda' }, quantity: 3 }
        ]
      }];
      const result = await aggregateSales(orders);
      expect(result.totalSales).toBe(35);
      expect(result.salesByCategory).toEqual({ Food: 20, Drink: 15 });
      expect(result.salesBySubCategory).toEqual({ Pizza: 20, Soda: 15 });
      expect(result.numberOfTransactions).toBe(1);
    });

    it('skips items without menuItem', async () => {
      const orders = [{
        items: [
          { menuItem: null, quantity: 2 },
          { menuItem: { price: 10, category: 'Food', subCategory: 'Pizza' }, quantity: 1 }
        ]
      }];
      const result = await aggregateSales(orders);
      expect(result.totalSales).toBe(10);
      expect(result.numberOfTransactions).toBe(1);
    });

    it('handles multiple orders', async () => {
      const orders = [
        { items: [{ menuItem: { price: 20, category: 'Food', subCategory: 'Main' }, quantity: 1 }] },
        { items: [{ menuItem: { price: 15, category: 'Drink', subCategory: 'Juice' }, quantity: 2 }] }
      ];
      const result = await aggregateSales(orders);
      expect(result.totalSales).toBe(50);
      expect(result.numberOfTransactions).toBe(2);
    });
  });

  describe('aggregateOrders', () => {
    it('returns empty stats for no orders', async () => {
      const result = await aggregateOrders([]);
      expect(result.totalOrders).toBe(0);
      expect(result.mostPopularItems).toEqual([]);
      expect(result.averageOrderValue).toBe(0);
    });

    it('aggregates order data', async () => {
      const orders = [{
        createdAt: new Date('2026-01-01T10:30:00'),
        totalAmount: 50,
        orderType: 'dine in',
        items: [
          { menuItem: { item: 'Burger' }, quantity: 2 },
          { menuItem: { item: 'Fries' }, quantity: 1 }
        ]
      }, {
        createdAt: new Date('2026-01-01T12:00:00'),
        totalAmount: 30,
        orderType: 'take away',
        items: [
          { menuItem: { item: 'Pizza' }, quantity: 1 }
        ]
      }];

      const result = await aggregateOrders(orders);
      expect(result.totalOrders).toBe(2);
      expect(result.averageOrderValue).toBe(40);
      expect(result.revenueByOrderType.dineIn).toBe(50);
      expect(result.revenueByOrderType.takeAway).toBe(30);
      expect(result.orderTypeCounts['dine in']).toBe(1);
      expect(result.orderTypeCounts['take away']).toBe(1);
      expect(result.mostPopularItems).toHaveLength(3);
      expect(result.mostPopularItems[0]).toEqual(['Burger', 2]);
    });

    it('handles online orders', async () => {
      const orders = [{
        createdAt: new Date('2026-01-01T14:00:00'),
        totalAmount: 100,
        orderType: 'online',
        items: [{ menuItem: { item: 'Combo' }, quantity: 1 }]
      }];
      const result = await aggregateOrders(orders);
      expect(result.revenueByOrderType.online).toBe(100);
      expect(result.orderTypeCounts.online).toBe(1);
    });

    it('skips items without menuItem', async () => {
      const orders = [{
        createdAt: new Date('2026-01-01T10:00:00'),
        totalAmount: 25,
        orderType: 'dine in',
        items: [{ menuItem: null, quantity: 2 }]
      }];
      const result = await aggregateOrders(orders);
      expect(result.mostPopularItems).toEqual([]);
      expect(result.totalOrders).toBe(1);
    });

    it('tracks sales over time and hourly volume', async () => {
      const orders = [{
        createdAt: new Date('2026-06-01T08:15:00'),
        totalAmount: 40,
        orderType: 'dine in',
        items: [{ menuItem: { item: 'Coffee' }, quantity: 1 }]
      }];
      const result = await aggregateOrders(orders);
      expect(result.salesOverTime['Mon Jun 01 2026']).toBe(40);
      expect(result.orderVolumeByHour[8]).toBe(1);
    });
  });
});
