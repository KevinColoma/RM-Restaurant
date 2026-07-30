import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get } from '../lib/api.js';
import { currentPage, renderPagination } from '../lib/listPage.js';

function filtersFromHash() {
  const q = window.location.hash.split('?')[1] || '';
  const params = new URLSearchParams(q);
  return {
    action: params.get('action') || '',
    collection: params.get('collection') || '',
    q: params.get('q') || '',
    dateFrom: params.get('dateFrom') || '',
    dateTo: params.get('dateTo') || ''
  };
}

function buildApiUrl() {
  const f = filtersFromHash();
  const params = new URLSearchParams();
  params.set('page', String(currentPage()));
  if (f.action) params.set('action', f.action);
  if (f.collection) params.set('collection', f.collection);
  if (f.q) params.set('q', f.q);
  if (f.dateFrom) params.set('dateFrom', f.dateFrom);
  if (f.dateTo) params.set('dateTo', f.dateTo);
  return '/audit-log?' + params.toString();
}

function filterQueryString() {
  const f = filtersFromHash();
  const params = new URLSearchParams();
  if (f.action) params.set('action', f.action);
  if (f.collection) params.set('collection', f.collection);
  if (f.q) params.set('q', f.q);
  if (f.dateFrom) params.set('dateFrom', f.dateFrom);
  if (f.dateTo) params.set('dateTo', f.dateTo);
  return params.toString();
}

function filterHash() {
  const q = filterQueryString();
  return '#/audit-log' + (q ? '?' + q : '');
}

function exportUrl(base) {
  const q = filterQueryString();
  return base + (q ? '?' + q : '');
}

registerRoute('/audit-log', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';
  try {
    const res = await get(buildApiUrl());
    const logs = res?.success ? (res.logs || res.data || []) : [];

    const t = (window.t || (x => x));

    const actionLabels = {
      create: t('audit.create'),
      update: t('audit.update'),
      delete: t('audit.delete'),
      cancel: t('audit.cancel'),
      login: t('audit.login'),
      logout: t('audit.logout'),
      password_change: t('audit.password'),
      settings_update: t('audit.update')
    };

    const actionBadges = {
      create: 'bg-success',
      update: 'bg-warning text-dark',
      settings_update: 'bg-warning text-dark',
      delete: 'bg-danger',
      cancel: 'bg-secondary',
      login: 'bg-info text-dark',
      logout: 'bg-dark',
      password_change: 'bg-primary'
    };

    const rows = logs.length ? logs.map(log => {
      const date = log.createdAt ? new Date(log.createdAt).toLocaleString() : '-';
      const label = actionLabels[log.action] || log.action || '-';
      const badgeClass = actionBadges[log.action] || 'bg-secondary';
      return `<tr>
        <td><span class="badge ${badgeClass}">${label}</span></td>
        <td>${log.collection || '-'}</td>
        <td>${log.documentId || '-'}</td>
        <td>${log.details || ''}</td>
        <td>${date}</td>
      </tr>`;
    }).join('') : '<tr><td colspan="5" class="text-center" data-i18n="table.no_activity">No activity recorded yet.</td></tr>';

    const f = filtersFromHash();

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="audit.title">Audit Log</h4>
<h6 data-i18n="audit.sub">Complete activity history</h6>
</div>
<div class="page-btn">
<a href="${exportUrl('/export/audit-log/pdf')}" class="btn btn-added me-2"><img src="assets/img/icons/pdf.svg" alt="" class="me-1">PDF</a>
<a href="${exportUrl('/export/audit-log/csv')}" class="btn btn-added"><img src="assets/img/icons/excel.svg" alt="" class="me-1">CSV</a>
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
</div>
<div class="card mb-0" id="filter_inputs" style="display:none">
<div class="card-body pb-0">
<div class="row">
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="audit.action">Action</label>
<select class="form-control" id="filter-action">
<option value="" data-i18n="filter.all">All</option>
<option value="create"${f.action === 'create' ? ' selected' : ''} data-i18n="audit.create">Create</option>
<option value="update"${f.action === 'update' || f.action === 'settings_update' ? ' selected' : ''} data-i18n="audit.update">Update</option>
<option value="delete"${f.action === 'delete' ? ' selected' : ''} data-i18n="audit.delete">Delete</option>
<option value="cancel"${f.action === 'cancel' ? ' selected' : ''} data-i18n="audit.cancel">Cancel</option>
<option value="login"${f.action === 'login' ? ' selected' : ''} data-i18n="audit.login">Login</option>
<option value="logout"${f.action === 'logout' ? ' selected' : ''} data-i18n="audit.logout">Logout</option>
<option value="password_change"${f.action === 'password_change' ? ' selected' : ''} data-i18n="audit.password">Password</option>
</select>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="audit.collection">Collection</label>
<select class="form-control" id="filter-collection">
<option value="" data-i18n="filter.all">All</option>
<option value="Menu"${f.collection === 'Menu' ? ' selected' : ''}>Menu</option>
<option value="Order"${f.collection === 'Order' ? ' selected' : ''}>Order</option>
<option value="InventoryItem"${f.collection === 'InventoryItem' ? ' selected' : ''}>Inventory</option>
<option value="Supplier"${f.collection === 'Supplier' ? ' selected' : ''}>Supplier</option>
<option value="Expense"${f.collection === 'Expense' ? ' selected' : ''}>Expense</option>
<option value="Customer"${f.collection === 'Customer' ? ' selected' : ''}>Customer</option>
<option value="Branch"${f.collection === 'Branch' ? ' selected' : ''}>Branch</option>
<option value="Purchase"${f.collection === 'Purchase' ? ' selected' : ''}>Purchase</option>
<option value="Persona"${f.collection === 'Persona' ? ' selected' : ''}>Persona</option>
<option value="Usuario"${f.collection === 'Usuario' ? ' selected' : ''}>User</option>
</select>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="filter.search">Search</label>
<input type="text" class="form-control" id="filter-q" placeholder="Search details..." value="${f.q}">
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="common.from">From</label>
<input type="date" class="form-control" id="filter-dateFrom" value="${f.dateFrom}">
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="common.to">To</label>
<input type="date" class="form-control" id="filter-dateTo" value="${f.dateTo}">
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
<table class="table datatable">
<thead>
<tr>
<th data-i18n="audit.action">Action</th>
<th data-i18n="audit.collection">Collection</th>
<th data-i18n="audit.document_id">Document ID</th>
<th data-i18n="audit.details">Details</th>
<th data-i18n="audit.datetime">Date / Time</th>
</tr>
</thead>
<tbody>${rows}</tbody>
</table>
</div>
${renderPagination(res)}
</div>
</div>
</div>
</div>`;

    renderLayout(app, 'audit-log', html);

    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.DataTable) {
        const $dt = $(app.querySelector('.datatable'));
        if ($dt.length && !$.fn.DataTable.isDataTable($dt[0])) {
          $dt.DataTable({ pageLength: 10, bFilter: false });
        }
      }
    }, 100);

    const applyBtn = app.querySelector('#apply-filters');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const action = app.querySelector('#filter-action').value;
        const collection = app.querySelector('#filter-collection').value;
        const q = app.querySelector('#filter-q').value;
        const dateFrom = app.querySelector('#filter-dateFrom').value;
        const dateTo = app.querySelector('#filter-dateTo').value;
        const params = new URLSearchParams();
        if (action) params.set('action', action);
        if (collection) params.set('collection', collection);
        if (q) params.set('q', q);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        const p = params.toString();
        window.location.hash = '#/audit-log' + (p ? '?' + p : '');
      });
    }

    const resetBtn = app.querySelector('#reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        window.location.hash = '#/audit-log';
      });
    }
  } catch (err) {
    app.innerHTML = `<div class="page-wrapper"><div class="content"><p class="text-danger">Failed to load: ${err.message}</p></div></div>`;
  }
});