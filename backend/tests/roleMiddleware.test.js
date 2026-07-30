const { requireWriteAccess } = require('../middleware/roleMiddleware');

function mockReqRes(path, method, rolNombre) {
  const req = {
    path: path || '/some-page',
    method: method || 'GET',
    usuario: rolNombre !== undefined ? { rolId: { nombre: rolNombre } } : undefined
  };
  const res = {
    _status: 0, _data: '', _redirect: '',
    status(code) { this._status = code; return this; },
    send(data) { this._data = data; return this; },
    json(data) { this._data = JSON.stringify(data); return this; },
    redirect(url) { this._redirect = url; this._status = 302; return this; }
  };
  return { req, res };
}

describe('requireWriteAccess', () => {
  it('passes admin on POST', () => {
    const { req, res } = mockReqRes('/api/menu', 'POST', 'admin');
    const next = jest.fn();
    requireWriteAccess(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('passes admin on PUT', () => {
    const { req, res } = mockReqRes('/api/menu/123', 'PUT', 'admin');
    const next = jest.fn();
    requireWriteAccess(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('passes admin on DELETE', () => {
    const { req, res } = mockReqRes('/api/menu/123', 'DELETE', 'admin');
    const next = jest.fn();
    requireWriteAccess(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('blocks non-admin on POST with 403 JSON for API path', () => {
    const { req, res } = mockReqRes('/api/menu', 'POST', 'mesero');
    const next = jest.fn();
    requireWriteAccess(req, res, next);
    expect(res._status).toBe(403);
    expect(res._data).toContain('Forbidden');
    expect(next).not.toHaveBeenCalled();
  });

  it('blocks non-admin on POST with 403 text for non-API path', () => {
    const { req, res } = mockReqRes('/menu', 'POST', 'mesero');
    const next = jest.fn();
    requireWriteAccess(req, res, next);
    expect(res._status).toBe(403);
    expect(typeof res._data).toBe('string');
    expect(res._data).toContain('Forbidden');
    expect(next).not.toHaveBeenCalled();
  });

  it('passes GET for any role', () => {
    for (const role of ['admin', 'mesero', 'cocinero', 'gerente']) {
      const { req, res } = mockReqRes('/api/menu', 'GET', role);
      const next = jest.fn();
      requireWriteAccess(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });

  it('passes exempt paths for non-admin', () => {
    const exemptPaths = ['/api/profile', '/api/pos', '/api/placeorder', '/api/orders', '/api/session/release'];
    for (const role of ['mesero', 'cocinero', 'gerente']) {
      for (const p of exemptPaths) {
        const { req, res } = mockReqRes(p, 'POST', role);
        const next = jest.fn();
        requireWriteAccess(req, res, next);
        expect(next).toHaveBeenCalled();
      }
    }
  });

  it('passes exempt paths with PATCH method', () => {
    const { req, res } = mockReqRes('/api/profile', 'PATCH', 'mesero');
    const next = jest.fn();
    requireWriteAccess(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('does not crash when usuario is missing', () => {
    const { req, res } = mockReqRes('/api/menu', 'POST');
    const next = jest.fn();
    requireWriteAccess(req, res, next);
    expect(res._status).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('does not crash when rolId is missing', () => {
    const req = { path: '/api/menu', method: 'POST', usuario: {} };
    const res = { _status: 0, _data: '', status(code) { this._status = code; return this; }, json(data) { this._data = JSON.stringify(data); return this; }, send(data) { this._data = data; return this; } };
    const next = jest.fn();
    requireWriteAccess(req, res, next);
    expect(res._status).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('does not crash when rolId.nombre is missing', () => {
    const req = { path: '/api/menu', method: 'POST', usuario: { rolId: {} } };
    const res = { _status: 0, _data: '', status(code) { this._status = code; return this; }, json(data) { this._data = JSON.stringify(data); return this; }, send(data) { this._data = data; return this; } };
    const next = jest.fn();
    requireWriteAccess(req, res, next);
    expect(res._status).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
});
