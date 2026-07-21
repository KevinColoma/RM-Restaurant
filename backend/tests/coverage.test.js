const jwtUtils = require('../jwt');
const Usuario = require('../models/Usuario');
const request = require('supertest');

jest.mock('../jwt');
jest.mock('../models/Usuario');

describe('Auth middleware – remaining branches', () => {
  it('returns 401 JSON when user not found on an API path', async () => {
    jwtUtils.verifyToken.mockResolvedValue({ usuarioId: '507f1f77bcf86cd799439011' });
    Usuario.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    const { requireAuth } = require('../middleware/authMiddleware');
    const req = { cookies: { jwt: 'x' }, path: '/api/dashboard' };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), redirect: jest.fn(), send: jest.fn() };
    await requireAuth(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found' });
  });

  it('sends 401 text when token throws on a non-API path', async () => {
    jwtUtils.verifyToken.mockRejectedValue(new Error('bad'));
    const { requireAuth } = require('../middleware/authMiddleware');
    const req = { cookies: { jwt: 'x' }, path: '/profile' };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn(), json: jest.fn(), redirect: jest.fn() };
    await requireAuth(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Invalid or expired token');
  });
});

describe('404 handler', () => {
  it('renders 404 for unknown routes', async () => {
    const app = require('../app');
    const res = await request(app).get('/this-does-not-exist-12345');
    expect(res.status).toBe(404);
  });
});
