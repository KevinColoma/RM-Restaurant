// controllers/expenseController.js

const Expense = require('../models/Expense');
const { logAudit } = require('../utils/audit');
const { isValidObjectId } = require('../utils/validate');

exports. addExpensePage = (req,res)=>{
    
    res.render('createexpense')

}

exports.addExpense = async (req, res) => {
    try {
        const { category, expenseDate, amount, invoiceNumber, vendor, description } = req.body;
        const personaId = req.personaId;

        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: 'Amount must be a valid number greater than zero' });
        }

        const newExpense = new Expense({
            personaId,
            expenseType: category,
            expenseDate,
            amount,
            description,
            paymentMethod: req.body.paymentMethod || 'other',
            ...(invoiceNumber ? { invoiceNumber } : {}),
            vendor,
            category,
            receiptURL: req.body.receiptURL || '',
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
        const personaId = req.personaId;

        const expenses = await Expense.find({personaId }).populate('personaId');
        res.render('expense-list', { expenses });
    } catch (err) {
        res.status(500).send('Server Error');
    }

}

// JSON list for the SPA. getExpense above renders the EJS page instead, which
// is why /api/expenses previously fell through to the catch-all and handed the
// SPA an HTML document where it expected data.
exports.listExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ personaId: req.personaId }).sort({ expenseDate: -1 });
        res.json({ success: true, expenses });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
}

// Single expense as JSON, for the SPA's edit screen.
exports.getExpenseById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid ID' });
        const expense = await Expense.findOne({ _id: req.params.id, personaId: req.personaId });
        if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
        res.json({ success: true, expense });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
}

exports.deleteExpense = async (req, res) => {
    try {
        const personaId = req.personaId;
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
        const expense = await Expense.findOneAndDelete({ _id: req.params.id, personaId });
        if (!expense) return res.status(404).json({ error: 'Expense not found' });
        await logAudit(req, 'delete', 'Expense', expense._id, 'Deleted expense: ' + expense.expenseType);
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
}

exports.updateExpense = async (req, res) => {
    try {
        const personaId = req.personaId;
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });

        const { category, expenseDate, amount, invoiceNumber, vendor, description, paymentMethod, receiptURL } = req.body;

        if (amount !== undefined) {
            const numericAmount = Number(amount);
            if (isNaN(numericAmount) || numericAmount <= 0) {
                return res.status(400).json({ message: 'Amount must be a valid number greater than zero' });
            }
        }

        const expense = await Expense.findOneAndUpdate(
            { _id: req.params.id, personaId },
            { expenseType: category, expenseDate, amount, description, paymentMethod, invoiceNumber, vendor, category, receiptURL, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
        if (!expense) return res.status(404).json({ error: 'Expense not found' });
        await logAudit(req, 'update', 'Expense', expense._id, 'Updated expense: ' + expense.expenseType);
        res.json(expense);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}