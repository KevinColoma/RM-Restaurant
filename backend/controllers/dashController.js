const mongoose = require('mongoose');
const Order = require('../models/order');
const Expense = require('../models/Expense');
const Menu = require('../models/menu');
const Purchase = require('../models/Purchase');

// Today's figures for one account. Shared by the EJS page and the SPA's JSON
// endpoint so both always report the same numbers.
async function buildDashboard(personaId) {
    {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const totalPurchases = await Purchase.countDocuments({
            personaId: new mongoose.Types.ObjectId(personaId),
            purchaseDate: { $gte: startOfDay, $lte: endOfDay }
        });

        const totalPurchaseAmount = await Purchase.aggregate([
            {
                $match: {
                    personaId: new mongoose.Types.ObjectId(personaId),
                    purchaseDate: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" }
                }
            }
        ]);

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

        const orderTypeBreakdown = await Order.aggregate([
            {
                $match: {
                    personaId: new mongoose.Types.ObjectId(personaId),
                    createdAt: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: "$orderType",
                    count: { $sum: 1 },
                    total: { $sum: "$totalAmount" }
                }
            }
        ]);

        const expensesByCategory = await Expense.aggregate([
            {
                $match: {
                    personaId: new mongoose.Types.ObjectId(personaId),
                    createdAt: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: "$category",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
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

        const totalEarningsVal = totalEarnings.length ? totalEarnings[0].total : 0;
        const totalExpensesVal = totalExpenses.length ? totalExpenses[0].total : 0;

        return {
            totalPurchases,
            totalOrders,
            totalEarnings: totalEarningsVal,
            totalExpenses: totalExpensesVal,
            totalPurchaseAmount: totalPurchaseAmount.length ? totalPurchaseAmount[0].total : 0,
            netProfit: totalEarningsVal - totalExpensesVal,
            orderTypeBreakdown,
            expensesByCategory,
            menus,
            mostPopularItems
        };
    }
}

exports.Dashboard = async (req, res) => {
    try {
        res.render('index', await buildDashboard(req.personaId));
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// Same figures as JSON, for the SPA dashboard.
exports.DashboardJson = async (req, res) => {
    try {
        const data = await buildDashboard(req.personaId);
        res.json({ success: true, ...data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
