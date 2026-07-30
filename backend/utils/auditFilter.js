const { escapeRegex } = require('./validate');

const VALID_ACTIONS = new Set(['create', 'update', 'delete', 'cancel', 'login', 'logout', 'password_change', 'settings_update', 'signup']);
const VALID_COLLECTIONS = new Set(['Menu', 'Order', 'InventoryItem', 'Supplier', 'Expense', 'Customer', 'Branch', 'Purchase', 'Persona', 'Usuario', 'Rol']);

function buildAuditFilter(personaId, query) {
  const filter = {};

  if (typeof query.action === 'string' && VALID_ACTIONS.has(query.action)) {
    filter.action = query.action;
  }

  if (typeof query.collection === 'string' && VALID_COLLECTIONS.has(query.collection)) {
    filter.collection = query.collection;
  }

  if (typeof query.q === 'string' && query.q.length > 0) {
    filter.details = { $regex: escapeRegex(query.q), $options: 'i' };
  }

  const dateFrom = typeof query.dateFrom === 'string' ? new Date(query.dateFrom) : null;
  if (dateFrom && !Number.isNaN(dateFrom.getTime())) {
    filter.createdAt = filter.createdAt || {};
    filter.createdAt.$gte = dateFrom;
  }

  const dateTo = typeof query.dateTo === 'string' ? new Date(query.dateTo) : null;
  if (dateTo && !Number.isNaN(dateTo.getTime())) {
    dateTo.setHours(23, 59, 59, 999);
    filter.createdAt = filter.createdAt || {};
    filter.createdAt.$lte = dateTo;
  }

  filter.personaId = personaId;
  return filter;
}

module.exports = { buildAuditFilter };