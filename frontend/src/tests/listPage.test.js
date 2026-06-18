import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../components/Header.js', () => ({
  renderLayout: vi.fn()
}));

global.$ = undefined;
global.Swal = undefined;

describe('listPage', () => {
  let app;

  beforeEach(() => {
    app = document.createElement('div');
  });

  it('showLoading sets loading HTML', async () => {
    const { showLoading } = await import('../lib/listPage.js');
    showLoading(app);
    expect(app.innerHTML).toContain('whirly-loader');
  });

  it('showError shows error message', async () => {
    const { showError } = await import('../lib/listPage.js');
    showError(app, new Error('test error'));
    expect(app.innerHTML).toContain('test error');
    expect(app.innerHTML).toContain('text-danger');
  });

  it('extractList returns items from success response', async () => {
    const { extractList } = await import('../lib/listPage.js');
    const res = { success: true, items: [{ id: 1 }] };
    expect(extractList(res, 'items')).toEqual([{ id: 1 }]);
  });

  it('extractList falls back to data key', async () => {
    const { extractList } = await import('../lib/listPage.js');
    const res = { success: true, data: [{ id: 2 }] };
    expect(extractList(res, 'items')).toEqual([{ id: 2 }]);
  });

  it('extractList returns fallback on missing data', async () => {
    const { extractList } = await import('../lib/listPage.js');
    const res = { success: true };
    expect(extractList(res, 'items', [])).toEqual([]);
  });

  it('extractList returns empty array when no success', async () => {
    const { extractList } = await import('../lib/listPage.js');
    expect(extractList(null, 'items', [])).toEqual([]);
  });

  it('extractList returns fallback array for non-success response', async () => {
    const { extractList } = await import('../lib/listPage.js');
    const fallback = [{ id: 3 }];
    expect(extractList({}, 'items', fallback)).toEqual(fallback);
  });

  it('renderPage calls renderLayout', async () => {
    const { renderLayout } = await import('../components/Header.js');
    const { renderPage } = await import('../lib/listPage.js');
    renderPage(app, 'test-page', '<p>content</p>');
    expect(renderLayout).toHaveBeenCalledWith(app, 'test-page', '<p>content</p>');
  });

  it('setupPage does nothing when $ is undefined', async () => {
    const { renderPage } = await import('../lib/listPage.js');
    renderPage(app, 'test', '<div class="datanew"></div>');
  });

  it('bindDelete binds click handler and triggers Swal', async () => {
    const mockFire = vi.fn().mockResolvedValue({ isConfirmed: false });
    global.Swal = { fire: mockFire };
    const { bindDelete } = await import('../lib/listPage.js');

    app.innerHTML = '<button class="del-btn" data-id="abc">Delete</button>';
    const del = vi.fn().mockResolvedValue();
    bindDelete(app, '.del-btn', { del, endpoint: '/api/items/', successMsg: 'Deleted', listRoute: '#/list' });

    app.querySelector('.del-btn').click();
    expect(mockFire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Are you sure?' }));
  });

  it('bindDelete calls delete when confirmed', async () => {
    global.Swal = { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) };
    const { bindDelete } = await import('../lib/listPage.js');

    app.innerHTML = '<button class="del-btn" data-id="xyz">Delete</button>';
    const del = vi.fn().mockResolvedValue();
    bindDelete(app, '.del-btn', { del, endpoint: '/api/items/', successMsg: 'Deleted!', listRoute: '#/list' });

    app.querySelector('.del-btn').click();
    await vi.waitFor(() => {
      expect(del).toHaveBeenCalledWith('/api/items/xyz');
    });
  });
});
