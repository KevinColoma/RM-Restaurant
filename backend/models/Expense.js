// models/Expense.js
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  personaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona',
    required: true
  },
  expenseType: {
    type: String,
    required: true
  },
  expenseDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be greater than zero']
  },
  description: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit card', 'bank transfer', 'other'],
    required: true
  },
  invoiceNumber: {
    type: String
  },
  vendor: {
    type: String,
  },
  category: {
    type: String,
  },
  receiptURL: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
