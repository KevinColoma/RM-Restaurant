// controllers/expenseController.js

const Expense = require('../models/Expense');
const { logAudit } = require('../utils/audit');

exports. addExpensePage = (req,res)=>{
    
    res.render('createexpense')

}

exports.addExpense = async (req, res) => {
    try {
        const { category, expenseDate, amount, invoiceNumber, vendor, description } = req.body;
        const restaurantId = req.restaurant.restaurantId;
        const newExpense = new Expense({
            restaurantId: restaurantId, // assuming you have middleware that sets req.restaurantId
            expenseType: category, // mapped from the form
            expenseDate,
            amount,
            description,
            paymentMethod: req.body.paymentMethod || 'other', // if paymentMethod is not included in the form
            invoiceNumber,
            vendor,
            category, // optionally map category to expense category if needed
            receiptURL: req.body.receiptURL || '', // if you handle receipts
        });

        await newExpense.save();
        await logAudit(req, 'create', 'Expense', newExpense._id, 'Created expense: ' + req.body.expenseType + ' - $' + req.body.amount);
        res.status(201).json(newExpense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.getExpense = async(req,res)=>{
    try {
        const restaurantId = req.restaurant.restaurantId;

        const expenses = await Expense.find({restaurantId }).populate('restaurantId');
        res.render('expense-list', { expenses });
    } catch (err) {
        res.status(500).send('Server Error');
    }

}

exports.deleteExpense = async (req, res) => {
    try {
        const restaurantId = req.restaurant.restaurantId;
        const expense = await Expense.findOneAndDelete({ _id: req.params.id, restaurantId });
        if (!expense) return res.status(404).json({ error: 'Expense not found' });
        await logAudit(req, 'delete', 'Expense', expense._id, 'Deleted expense: ' + expense.expenseType);
        res.send('Expense deleted');
    } catch (err) {
        res.status(500).send('Server Error');
    }
}

exports.updateExpense = async (req, res) => {
    try {
        const restaurantId = req.restaurant.restaurantId;
        const expense = await Expense.findOneAndUpdate(
            { _id: req.params.id, restaurantId },
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );
        if (!expense) return res.status(404).json({ error: 'Expense not found' });
        await logAudit(req, 'update', 'Expense', expense._id, 'Updated expense: ' + expense.expenseType);
        res.json(expense);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}