const { escapeRegex } = require('./validate');

const VALID_ACTIONS = new Set(['create', 'update', 'delete', 'cancel', 'login', 'logout', 'password_change', 'settings_update', 'signup']);
const VALID_COLLECTIONS = new Set(['Menu', 'Order', 'InventoryItem', 'Supplier', 'Expense', 'Customer', 'Branch', 'Purchase', 'Persona', 'Usuario', 'Rol']);

function buildAuditFilter(personaId, action, collection, q, dateFrom, dateTo) {
  const filter = {};
  filter.personaId = personaId;

  if (VALID_ACTIONS.has(action)) {
    filter.action = action;
  }

  if (VALID_COLLECTIONS.has(collection)) {
    filter.collection = collection;
  }

  const search = q;
  if (typeof search === 'string' && search.length > 0) {
    filter.details = { $regex: escapeRegex(search), $options: 'i' };
  }

  if (typeof dateFrom === 'string') {
    const from = new Date(dateFrom);
    if (!Number.isNaN(from.getTime())) {
      filter.createdAt = filter.createdAt || {};
      filter.createdAt.$gte = from;
    }
  }

  if (typeof dateTo === 'string') {
    const to = new Date(dateTo);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      filter.createdAt = filter.createdAt || {};
      filter.createdAt.$lte = to;
    }
  }

  return filter;
}

module.exports = { buildAuditFilter };