const mongoose = require('mongoose');
const Order = require('../models/order');
const Expense = require('../models/Expense');
const Menu = require('../models/menu');
const Purchase = require('../models/Purchase');

exports.Dashboard = async (req, res) => {
    try {
        const personaId = req.personaId;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const totalPurchases = await Purchase.countDocuments({
            personaId: new mongoose.Types.ObjectId(personaId),
            purchaseDate: { $gte: startOfDay, $lte: endOfDay }
        });

        const totalOrders = await Order.countDocuments({
            personaId: new mongoose.Types.ObjectId(personaId),
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        const totalEarnings = await Order.aggregate([
            {
                $match: {
                    personaId: new mongoose.Types.ObjectId(personaId),
                    createdAt: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" }
                }
            }
        ]);

        const totalExpenses = await Expense.aggregate([
            {
                $match: {
                    personaId: new mongoose.Types.ObjectId(personaId),
                    createdAt: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const menus = await Menu.find({ personaId: new mongoose.Types.ObjectId(personaId) });

        const orders = await Order.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            personaId
        }).populate('items.menuItem');

        let itemCounts = {};
        let totalAmount = 0;

        orders.forEach(order => {
            order.items.forEach(item => {
                const itemName = item.menuItem.item;
                itemCounts[itemName] = (itemCounts[itemName] || 0) + item.quantity;
            });
            totalAmount += order.totalAmount;
        });

        const mostPopularItems = Object.entries(itemCounts)
            .map(([itemName, quantity]) => ({ item: itemName, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 7); // Get top 7 items

        res.render('index', {
            totalPurchases,
            totalOrders,
            totalEarnings: totalEarnings.length ? totalEarnings[0].total : 0,
            totalExpenses: totalExpenses.length ? totalExpenses[0].total : 0,
            menus,
            mostPopularItems
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
