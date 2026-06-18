const mongoose = require('mongoose');
const { setupDB, teardownDB } = require('./helpers/db');
const AuditLog = require('../models/AuditLog');

describe('audit', () => {
  beforeAll(setupDB);
  afterAll(teardownDB);

  beforeEach(async () => {
    await AuditLog.deleteMany({});
  });

  it('should not create log when personaId is missing', async () => {
    const { logAudit } = require('../utils/audit');
    const req = { personaId: null };
    await logAudit(req, 'test', 'Collection', 'id123', 'details');
    const count = await AuditLog.countDocuments();
    expect(count).toBe(0);
  });

  it('should create an audit log entry', async () => {
    const { logAudit } = require('../utils/audit');
    const personaId = new mongoose.Types.ObjectId();
    const req = { personaId };
    await logAudit(req, 'create', 'Customer', personaId, 'Created test');
    const logs = await AuditLog.find();
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('create');
    expect(logs[0].collection).toBe('Customer');
    expect(logs[0].details).toBe('Created test');
  });

  it('should handle missing optional fields', async () => {
    const { logAudit } = require('../utils/audit');
    const personaId = new mongoose.Types.ObjectId();
    const req = { personaId };
    await logAudit(req, 'delete', 'Menu');
    const logs = await AuditLog.find();
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('delete');
  });

  it('should handle database error gracefully (line 17)', async () => {
    const originalCreate = AuditLog.create;
    AuditLog.create = jest.fn().mockRejectedValue(new Error('DB failure'));
    const { logAudit } = require('../utils/audit');
    const req = { personaId: new mongoose.Types.ObjectId() };
    await expect(logAudit(req, 'test', 'Coll')).resolves.toBeUndefined();
    AuditLog.create = originalCreate;
  });
});
