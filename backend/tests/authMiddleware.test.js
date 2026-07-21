const jwtUtils = require('../jwt');
const Usuario = require('../models/Usuario');

jest.mock('../jwt');
jest.mock('../models/Usuario');

function mockReqRes(path) {
  const req = { cookies: {}, path: path || '/some-page' };
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

  it('should send 401 when token verification throws on an API path', async () => {
    jwtUtils.verifyToken.mockRejectedValue(new Error('Token blacklisted'));
    const { requireAuth } = require('../middleware/authMiddleware');
    const { req, res } = mockReqRes('/api/dashboard');
    req.cookies.jwt = 'bad-token';
    const next = jest.fn();

    await requireAuth(req, res, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with valid user', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const personaId = { _id: '507f1f77bcf86cd799439012', ownerName: 'Test', restaurantName: 'Test Rest', avatar: 'pic.jpg' };
    const sessionId = 'session-abc-123';

    jwtUtils.verifyToken.mockResolvedValue({ usuarioId: userId, sessionId });
    Usuario.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: userId, personaId, activeSessionId: sessionId,
        lastSeenAt: null, save: jest.fn().mockResolvedValue()
      })
    });

    const { requireAuth } = require('../middleware/authMiddleware');
    const { req, res } = mockReqRes();
    req.cookies.jwt = 'valid-token';
    const next = jest.fn();

    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.personaId).toBe(personaId._id);
  });

  it('should still authenticate when the lastSeenAt write fails', async () => {
    // Activity tracking is bookkeeping; a failed write must never cost a
    // legitimate user their session.
    const userId = '507f1f77bcf86cd799439011';
    const personaId = { _id: '507f1f77bcf86cd799439012', ownerName: 'Test', restaurantName: 'Test Rest', avatar: '' };
    const sessionId = 'session-abc-123';

    jwtUtils.verifyToken.mockResolvedValue({ usuarioId: userId, sessionId });
    Usuario.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: userId, personaId, activeSessionId: sessionId,
        lastSeenAt: null, save: jest.fn().mockRejectedValue(new Error('DB down'))
      })
    });

    const { requireAuth } = require('../middleware/authMiddleware');
    const { req, res } = mockReqRes();
    req.cookies.jwt = 'valid-token';
    const next = jest.fn();

    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should still authenticate when another device holds the active session (soft single-session)', async () => {
    // Soft single-session: an already-authenticated token stays valid even
    // after a later login elsewhere changed activeSessionId. "One at a time"
    // is only surfaced at login, never enforced mid-session, so the user is
    // not kicked out on navigation.
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
    expect(next).toHaveBeenCalled();
    expect(req.personaId).toBe(personaId._id);
  });
});
