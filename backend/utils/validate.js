const mongoose = require('mongoose');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function validateObjectId(req, res, next) {
  if (req.params.id && !isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  next();
}

function sanitizeFields(body, allowed) {
  const safe = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      safe[key] = body[key];
    }
  }
  return safe;
}

function isPositiveNumber(val) {
  const n = Number(val);
  return !isNaN(n) && n > 0;
}

function isValidEmail(val) {
  return typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

module.exports = { isValidObjectId, validateObjectId, sanitizeFields, isPositiveNumber, isValidEmail };