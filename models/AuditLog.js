const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'cancel', 'login', 'logout', 'password_change', 'settings_update'],
    required: true
  },
  collection: {
    type: String,
    enum: ['Menu', 'Order', 'InventoryItem', 'Supplier', 'Expense', 'Customer', 'Branch', 'Purchase', 'Restaurant'],
    required: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: String,
    default: ''
  },
  changes: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

auditLogSchema.index({ restaurantId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
