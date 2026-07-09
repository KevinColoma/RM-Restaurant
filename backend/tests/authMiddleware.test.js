const jwtUtils = require('../jwt');
const Usuario = require('../models/Usuario');

jest.mock('../jwt');
jest.mock('../models/Usuario');

function mockReqRes() {
  const req = { cookies: {} };
  const res = {
    _status: 0,
    _data: '',
    _redirect: '',
    _locals: {},
    status(code) { this._status = code; return this; },
    send(data) { this._data = data; return this; },
    redirect(url) { this._redirect = url; this._status = 302; return this; },
    json(data) { this._data = JSON.stringify(data); return this; },
    clearCookie() { return this; },
    locals: this ? this._locals : {}
  };
  res.locals = {};
  return { req, res };
}

describe('authMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to signin when token verification returns null', async () => {
    jwtUtils.verifyToken.mockResolvedValue(null);
    const { requireAuth } = require('../middleware/authMiddleware');
    const { req, res } = mockReqRes();
    req.cookies.jwt = 'invalid-token';
    const next = jest.fn();

    await requireAuth(req, res, next);
    expect(res._status).toBe(302);
    expect(res._redirect).toBe('/signin');
    expect(next).not.toHaveBeenCalled();
  });

  it('should redirect to signin when user is not found', async () => {
    jwtUtils.verifyToken.mockResolvedValue({ usuarioId: 'nonexistent' });
    Usuario.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
    const { requireAuth } = require('../middleware/authMiddleware');
    const { req, res } = mockReqRes();
    req.cookies.jwt = 'valid-token';
    const next = jest.fn();

    await requireAuth(req, res, next);
    expect(res._status).toBe(302);
    expect(res._redirect).toBe('/signin');
    expect(next).not.toHaveBeenCalled();
  });

  it('should send 401 when token verification throws', async () => {
    jwtUtils.verifyToken.mockRejectedValue(new Error('Token blacklisted'));
    const { requireAuth } = require('../middleware/authMiddleware');
    const { req, res } = mockReqRes();
    req.cookies.jwt = 'bad-token';
    const next = jest.fn();

    await requireAuth(req, res, next);
    expect(res._status).toBe(401);
    expect(res._data).toBe('Token is blacklisted');
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with valid user', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const personaId = { _id: '507f1f77bcf86cd799439012', ownerName: 'Test', restaurantName: 'Test Rest', avatar: 'pic.jpg' };
    const sessionId = 'session-abc-123';

    jwtUtils.verifyToken.mockResolvedValue({ usuarioId: userId, sessionId });
    Usuario.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: userId, personaId, activeSessionId: sessionId })
    });

    const { requireAuth } = require('../middleware/authMiddleware');
    const { req, res } = mockReqRes();
    req.cookies.jwt = 'valid-token';
    const next = jest.fn();

    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.personaId).toBe(personaId._id);
  });

  it('should reject when the session was invalidated by a login on another device', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const personaId = { _id: '507f1f77bcf86cd799439012', ownerName: 'Test', restaurantName: 'Test Rest', avatar: 'pic.jpg' };

    jwtUtils.verifyToken.mockResolvedValue({ usuarioId: userId, sessionId: 'old-session' });
    Usuario.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: userId, personaId, activeSessionId: 'new-session' })
    });

    const { requireAuth } = require('../middleware/authMiddleware');
    const { req, res } = mockReqRes();
    req.cookies.jwt = 'stale-token';
    const next = jest.fn();

    await requireAuth(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });
});
