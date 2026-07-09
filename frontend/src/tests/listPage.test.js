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

  it('bindFilterToggle hides panel initially and toggles on click', async () => {
    const { bindFilterToggle, renderFilterPanel } = await import('../lib/listPage.js');
    app.innerHTML = '<a class="btn btn-filter" id="filter_search"><span></span></a>' + renderFilterPanel([]);
    bindFilterToggle(app);
    const panel = app.querySelector('#filter_inputs');
    expect(panel.style.display).toBe('none');
    app.querySelector('#filter_search').click();
    expect(panel.style.display).toBe('block');
    app.querySelector('#filter_search').click();
    expect(panel.style.display).toBe('none');
  });

  it('bindFilterToggle does nothing if btn or panel missing', async () => {
    const { bindFilterToggle } = await import('../lib/listPage.js');
    bindFilterToggle(app);
  });

  it('renderFilterPanel returns HTML with fields and action buttons', async () => {
    const { renderFilterPanel } = await import('../lib/listPage.js');
    const html = renderFilterPanel([
      { key: 'cat', label: 'Category', options: ['A', 'B'] },
      { key: 'sub', label: 'Sub', options: ['X'] }
    ]);
    expect(html).toContain('id="filter_inputs"');
    expect(html).toContain('data-field="cat"');
    expect(html).toContain('data-field="sub"');
    expect(html).toContain('id="apply-filters"');
    expect(html).toContain('id="reset-filters"');
    expect(html).toContain('btn btn-added');
    expect(html).toContain('btn btn-cancel');
    expect(html).toContain('Category');
    expect(html).toContain('<option value="A">A</option>');
  });

  it('renderFilterPanel escapes quotes in option values', async () => {
    const { renderFilterPanel } = await import('../lib/listPage.js');
    const html = renderFilterPanel([
      { key: 'test', label: 'Test', options: ['with"quote'] }
    ]);
    expect(html).toContain('with&quot;quote');
  });

  it('bindFilterPanel filters data and re-renders tbody', async () => {
    const { bindFilterPanel } = await import('../lib/listPage.js');
    const data = [
      { name: 'Apple', color: 'red' },
      { name: 'Banana', color: 'yellow' },
      { name: 'Strawberry', color: 'red' }
    ];
    const renderRows = vi.fn(list => list.map(i => `<tr><td>${i.name}</td></tr>`).join(''));
    app.innerHTML = '<table class="datanew"><tbody></tbody></table>';
    app.innerHTML += '<select class="filter-field" data-field="color"><option value="">All</option><option value="red">Red</option><option value="yellow">Yellow</option></select>';
    app.innerHTML += '<a id="apply-filters">Apply</a><a id="reset-filters">Reset</a>';

    bindFilterPanel(app, { data, renderRows });

    const sel = app.querySelector('.filter-field');
    sel.value = 'red';
    sel.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(renderRows).toHaveBeenCalledWith([{ name: 'Apple', color: 'red' }, { name: 'Strawberry', color: 'red' }]);
    });
  });

  it('bindFilterPanel reset clears filters and shows all data', async () => {
    const { bindFilterPanel } = await import('../lib/listPage.js');
    const data = [
      { name: 'A', color: 'red' },
      { name: 'B', color: 'blue' }
    ];
    const renderRows = vi.fn(list => list.map(i => `<tr><td>${i.name}</td></tr>`).join(''));

    app.innerHTML = '<table class="datanew"><tbody></tbody></table>';
    app.innerHTML += '<select class="filter-field" data-field="color"><option value="">All</option><option value="red">Red</option></select>';
    app.innerHTML += '<a id="apply-filters">Apply</a><a id="reset-filters">Reset</a>';

    bindFilterPanel(app, { data, renderRows });

    const sel = app.querySelector('.filter-field');
    sel.value = 'red';
    sel.dispatchEvent(new Event('change'));

    app.querySelector('#reset-filters').click();

    await vi.waitFor(() => {
      expect(renderRows).toHaveBeenCalledWith(data);
    });
  });

  it('bindFilterPanel does nothing if apply btn missing', async () => {
    const { bindFilterPanel } = await import('../lib/listPage.js');
    bindFilterPanel(app, { data: [], renderRows: vi.fn() });
  });

  it('uniqueValues extracts unique non-empty values', async () => {
    const { uniqueValues } = await import('../lib/listPage.js');
    const items = [
      { color: 'red' }, { color: 'blue' }, { color: 'red' }, { color: null }, { color: undefined }, { color: '' }
    ];
    expect(uniqueValues(items, 'color')).toEqual(['red', 'blue']);
  });

  it('uniqueValues returns empty array for empty input', async () => {
    const { uniqueValues } = await import('../lib/listPage.js');
    expect(uniqueValues([], 'color')).toEqual([]);
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

  it('bindDelete shows error on delete failure', async () => {
    const mockFire = vi.fn();
    global.Swal = { fire: mockFire.mockResolvedValueOnce({ isConfirmed: true }).mockResolvedValueOnce({}) };
    const { bindDelete } = await import('../lib/listPage.js');

    app.innerHTML = '<button class="del-btn" data-id="err">Delete</button>';
    const del = vi.fn().mockRejectedValue(new Error('Network error'));
    bindDelete(app, '.del-btn', { del, endpoint: '/api/items/', successMsg: 'Deleted!', listRoute: '#/list' });

    app.querySelector('.del-btn').click();
    await vi.waitFor(() => {
      expect(mockFire).toHaveBeenLastCalledWith('Error!', 'Failed to delete: Network error', 'error');
    });
  });
});
