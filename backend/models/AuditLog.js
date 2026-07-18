const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  personaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona',
    required: true
  },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'cancel', 'login', 'logout', 'password_change', 'settings_update', 'signup'],
    required: true
  },
  collection: {
    type: String,
    enum: ['Menu', 'Order', 'InventoryItem', 'Supplier', 'Expense', 'Customer', 'Branch', 'Purchase', 'Persona', 'Usuario', 'Rol'],
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
}, { timestamps: true, suppressReservedKeysWarning: true });

auditLogSchema.index({ personaId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
