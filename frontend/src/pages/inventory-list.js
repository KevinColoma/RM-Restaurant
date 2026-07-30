import { registerRoute } from '../router.js';
import { showLoading, showError, renderPage, bindDelete, extractList, currentPage, renderPagination, emptyState } from '../lib/listPage.js';
import { get, del } from '../lib/api.js';

function filtersFromHash() {
  const q = window.location.hash.split('?')[1] || '';
  const params = new URLSearchParams(q);
  return {
    q: params.get('q') || '',
    lowStock: params.get('lowStock') || ''
  };
}

function buildApiUrl() {
  const f = filtersFromHash();
  const params = new URLSearchParams();
  params.set('page', String(currentPage()));
  if (f.q) params.set('q', f.q);
  if (f.lowStock) params.set('lowStock', f.lowStock);
  return '/inventory?' + params.toString();
}

function filterHash() {
  const f = filtersFromHash();
  const params = new URLSearchParams();
  if (f.q) params.set('q', f.q);
  if (f.lowStock) params.set('lowStock', f.lowStock);
  const p = params.toString();
  return '#/inventory-list' + (p ? '?' + p : '');
}

registerRoute('/inventory-list', async (app) => {
  showLoading(app);
  try {
    const res = await get(buildApiUrl());
    const items = extractList(res, 'inventoryItems');

    const renderRows = (list) => list.length ? list.map(item => {
      const price = typeof item.price === 'number' ? item.price.toFixed(2) : (item.price || '0.00');
      const supplierName = item.supplier?.name || '-';
      const lowStock = item.quantity <= 10 ? '<span class="badge bg-warning">' + (window.t ? window.t('filter.low_stock_badge') : 'Low Stock') + '</span>' : '';
      return `<tr>
        <td class="productimgname"><a href="javascript:void(0);">${item.name || ''}</a></td>
        <td>${supplierName}</td>
        <td>${item.quantity || 0} ${lowStock}</td>
        <td>${price}</td>
        <td>${supplierName}</td>
        <td>
          <a class="me-3" aria-label="Edit inventory item" title="Edit inventory item" data-i18n-aria="action.edit_inventory" href="#/inventory-edit/${item._id}"><img src="assets/img/icons/edit.svg" alt=""></a>
          <a href="javascript:void(0);" class="delete-item" aria-label="Delete inventory item" title="Delete inventory item" data-i18n-aria="action.delete_inventory" data-id="${item._id}"><img src="assets/img/icons/delete.svg" alt=""></a>
        </td>
      </tr>`;
    }).join('') : emptyState({ colspan: 6, title: 'No inventory items yet', i18nTitle: 'empty.no_inventory', hint: 'Add stock to keep track of what you have on hand.', i18nHint: 'empty.inventory_hint', actionHref: '#/inventory-add', actionLabel: 'Add the first item', i18nAction: 'empty.inventory_action' });

    const f = filtersFromHash();

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="list.inventory_title">Inventory List</h4>
<h6 data-i18n="list.inventory_sub">Manage your inventory</h6>
</div>
<div class="page-btn">
<a href="#/inventory-add" class="btn btn-added" data-i18n="list.add_new_inventory"><img src="assets/img/icons/plus.svg" alt="" class="me-1">Add New Item</a>
</div>
</div>
<div class="card">
<div class="card-body">
<div class="table-top">
<div class="search-set">
<div class="search-path">
<a class="btn btn-filter" id="filter_search" title="Filter what this list shows" aria-label="Filter what this list shows">
<img src="assets/img/icons/filter.svg" alt="">
<span><img src="assets/img/icons/closes.svg" alt=""></span>
</a>
</div>
<div class="search-input">
<a class="btn btn-searchset"><img src="assets/img/icons/search-white.svg" alt=""></a>
</div>
</div>
<div class="wordset">
<ul>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="Print this list" onclick="window.print()"><img src="assets/img/icons/printer.svg" alt=""></a></li>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="Download this list as a PDF" href="/export/inventory/pdf"><img src="assets/img/icons/pdf.svg" alt=""></a></li>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="Download this list as a spreadsheet (CSV)" href="/export/inventory/csv"><img src="assets/img/icons/excel.svg" alt=""></a></li>
</ul>
</div>
</div>
<div class="card mb-0" id="filter_inputs" style="display:none">
<div class="card-body pb-0">
<div class="row">
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="filter.search">Search</label>
<input type="text" class="form-control" id="filter-q" data-i18n-placeholder="filter.search_item_name" placeholder="Search item name..." value="${f.q}">
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="filter.stock_level">Stock Level</label>
<select class="form-control" id="filter-lowStock">
<option value="" data-i18n="filter.all">All</option>
<option value="true" data-i18n="filter.low_stock"${f.lowStock === 'true' ? ' selected' : ''}>Low Stock (≤10)</option>
</select>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12 d-flex align-items-end">
<div class="form-group mb-0 d-flex">
<a class="btn btn-primary" id="apply-filters"><span data-i18n="common.apply">Apply</span></a>
<a class="btn btn-secondary ms-2" id="reset-filters"><span data-i18n="common.reset">Reset</span></a>
</div>
</div>
</div>
</div>
</div>
<div class="table-responsive">
<table class="table datanew">
<thead>
<tr>
<th data-i18n="table.name">Item Name</th>
<th data-i18n="table.category">Category</th>
<th data-i18n="table.qty">Quantity</th>
<th data-i18n="table.price">Price</th>
<th data-i18n="table.supplier">Supplier</th>
<th data-i18n="table.action">Actions</th>
</tr>
</thead>
<tbody>${renderRows(items)}</tbody>
</table>
</div>
${renderPagination(res)}
</div>
</div>
</div>
</div>`;

    const bindItemDelete = () => bindDelete(app, '.delete-item', { itemName: window.t('delete.inventory_item'), del, endpoint: '/inventory/', successMsg: window.t('delete.inventory_item_deleted'), listRoute: filterHash() });

    renderPage(app, 'inventory-list', html);
    bindItemDelete();

    const applyBtn = app.querySelector('#apply-filters');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const q = app.querySelector('#filter-q').value;
        const lowStock = app.querySelector('#filter-lowStock').value;
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (lowStock) params.set('lowStock', lowStock);
        const p = params.toString();
        window.location.hash = '#/inventory-list' + (p ? '?' + p : '');
      });
    }

    const resetBtn = app.querySelector('#reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        window.location.hash = '#/inventory-list';
      });
    }
  } catch (err) { showError(app, err); }
});