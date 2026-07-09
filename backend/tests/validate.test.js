const { isValidObjectId, validateObjectId, sanitizeFields, isPositiveNumber, isValidEmail } = require('../utils/validate');
const mongoose = require('mongoose');

describe('validate utils', () => {
  describe('validateObjectId', () => {
    it('calls next() when id is valid', () => {
      const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      validateObjectId(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 400 when id is invalid', () => {
      const req = { params: { id: 'bad-id' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      validateObjectId(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid ID format' });
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next() when id is missing', () => {
      const req = { params: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      validateObjectId(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('isValidObjectId', () => {
    it('returns true for valid ObjectId', () => {
      expect(isValidObjectId(new mongoose.Types.ObjectId().toString())).toBe(true);
    });

    it('returns false for invalid ObjectId', () => {
      expect(isValidObjectId('not-an-id')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidObjectId('')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isValidObjectId(null)).toBe(false);
    });
  });

  describe('sanitizeFields', () => {
    it('only keeps allowed fields', () => {
      const result = sanitizeFields({ name: 'John', role: 'admin', extra: 'bad' }, ['name', 'role']);
      expect(result).toEqual({ name: 'John', role: 'admin' });
    });

    it('returns empty object when no allowed fields match', () => {
      const result = sanitizeFields({ a: 1, b: 2 }, ['c']);
      expect(result).toEqual({});
    });

    it('skips undefined fields', () => {
      const result = sanitizeFields({ name: 'John', role: undefined }, ['name', 'role']);
      expect(result).toEqual({ name: 'John' });
    });
  });

  describe('isPositiveNumber', () => {
    it('returns true for positive numbers', () => {
      expect(isPositiveNumber(10)).toBe(true);
      expect(isPositiveNumber('15')).toBe(true);
      expect(isPositiveNumber(0.01)).toBe(true);
    });

    it('returns false for zero', () => {
      expect(isPositiveNumber(0)).toBe(false);
    });

    it('returns false for negative', () => {
      expect(isPositiveNumber(-5)).toBe(false);
    });

    it('returns false for non-numeric strings', () => {
      expect(isPositiveNumber('abc')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('returns true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co')).toBe(true);
    });

    it('returns false for invalid emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });

    it('returns false for non-strings', () => {
      expect(isValidEmail(123)).toBe(false);
    });
  });
});