const { generateToken, verifyToken } = require('../jwt');

describe('jwt', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
  });

  it('generateToken returns a JWT string with 3 parts', () => {
    const payload = { id: 1, name: 'test' };
    const token = generateToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('verifyToken decodes a valid token', async () => {
    const payload = { id: 42, role: 'admin' };
    const token = generateToken(payload);
    const decoded = await verifyToken(token);
    expect(decoded).toMatchObject(payload);
  });

  it('verifyToken returns null for invalid token', async () => {
    const result = await verifyToken('invalid-token-here');
    expect(result).toBeNull();
  });

  it('verifyToken returns null for expired token', async () => {
    const payload = { id: 1 };
    const token = generateToken(payload);
    const expiredToken = token.replace(/^(.+?)\.(.+?)\.(.+)$/, (_, h, _p, s) => {
      const expiredPayload = Buffer.from(JSON.stringify({ id: 1, exp: 0 })).toString('base64url');
      return `${h}.${expiredPayload}.${s}`;
    });
    const result = await verifyToken(expiredToken);
    expect(result).toBeNull();
  });
});
