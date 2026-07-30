import { registerRoute } from '../router.js';
import { showLoading, showError, renderPage, bindDelete, extractList, currentPage, renderPagination, emptyState, canWrite } from '../lib/listPage.js';
import { get, del } from '../lib/api.js';

function filtersFromHash() {
  const q = window.location.hash.split('?')[1] || '';
  const params = new URLSearchParams(q);
  return {
    orderType: params.get('orderType') || '',
    dateFrom: params.get('dateFrom') || '',
    dateTo: params.get('dateTo') || ''
  };
}

function buildApiUrl() {
  const f = filtersFromHash();
  const params = new URLSearchParams();
  params.set('page', String(currentPage()));
  if (f.orderType) params.set('orderType', f.orderType);
  if (f.dateFrom) params.set('dateFrom', f.dateFrom);
  if (f.dateTo) params.set('dateTo', f.dateTo);
  return '/orders?' + params.toString();
}

function filterHash() {
  const f = filtersFromHash();
  const params = new URLSearchParams();
  if (f.orderType) params.set('orderType', f.orderType);
  if (f.dateFrom) params.set('dateFrom', f.dateFrom);
  if (f.dateTo) params.set('dateTo', f.dateTo);
  const q = params.toString();
  return '#/orders-list' + (q ? '?' + q : '');
}

registerRoute('/orders-list', async (app) => {
  showLoading(app);
  try {
    const res = await get(buildApiUrl());
    const orders = extractList(res, 'orders');
    // Row number instead of the Mongo _id - the id has no meaning to the user
    // and shouldn't be shown in a list, but stays on data-id for the cancel action.
    const rowOffset = ((res?.page || 1) - 1) * (res?.limit || 0);
    const rows = orders.length ? orders.map((o, i) => {
      const items = o.items ? o.items.map(oi => oi.menuItem ? oi.menuItem.item : (window.t ? window.t('orders.unknown_item') : 'Unknown')).join(', ') : '-';
      const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-';
      return `<tr>
        <td>${rowOffset + i + 1}</td>
        <td>${items}</td>
        <td>${typeof o.totalAmount === 'number' ? o.totalAmount.toFixed(2) : (o.totalAmount || '0.00')}</td>
        <td>${o.taxAmount !== undefined ? (typeof o.taxAmount === 'number' ? o.taxAmount.toFixed(2) : o.taxAmount) : '-'}</td>
        <td>${o.orderType || '-'}</td>
        <td>${o.comment || '-'}</td>
        <td>${date}</td>
        <td>
          <a href="javascript:void(0);" class="btn btn-sm btn-danger cancel-order" data-id="${o._id}" data-i18n="orders.cancel">Cancel</a>
        </td>
      </tr>`;
    }).join('') : emptyState({ colspan: 8, title: 'No orders yet', i18nTitle: 'empty.no_orders', hint: 'Orders appear here once you start billing.', i18nHint: 'empty.orders_hint', actionHref: '#/pos', actionLabel: 'Go to billing', i18nAction: 'empty.orders_action' });

    const f = filtersFromHash();

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="list.orders_title">Orders List</h4>
<h6 data-i18n="list.orders_sub">Manage your orders</h6>
</div>
<div class="page-btn">
<a href="/export/orders/pdf" class="btn btn-added me-2"><img src="assets/img/icons/pdf.svg" alt="" class="me-1">PDF</a>
<a href="/export/orders/csv" class="btn btn-added"><img src="assets/img/icons/excel.svg" alt="" class="me-1">CSV</a>
</div>
</div>
<div class="card">
<div class="card-body">
<div class="row mb-3 align-items-end">
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="table.order_type">Order Type</label>
      <select class="form-control" id="filter-orderType">
<option value="" data-i18n="filter.all">All</option>
<option value="dine-in" data-i18n="filter.dine_in"${f.orderType === 'dine-in' ? ' selected' : ''}>Dine-in</option>
<option value="takeaway" data-i18n="filter.takeaway"${f.orderType === 'takeaway' ? ' selected' : ''}>Takeaway</option>
<option value="delivery" data-i18n="filter.delivery"${f.orderType === 'delivery' ? ' selected' : ''}>Delivery</option>
</select>
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
<div class="table-responsive">
<table class="table datanew">
<thead>
<tr>
<th data-i18n="table.row_number">#</th>
<th data-i18n="table.items">Items</th>
<th data-i18n="table.total">Total</th>
<th data-i18n="table.tax">Tax</th>
<th data-i18n="table.order_type">Type</th>
<th data-i18n="table.comment">Comment</th>
<th data-i18n="table.date">Date</th>
<th data-i18n="table.action">Actions</th>
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

    renderPage(app, 'orders-list', html);

    const applyBtn = app.querySelector('#apply-filters');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const orderType = app.querySelector('#filter-orderType').value;
        const dateFrom = app.querySelector('#filter-dateFrom').value;
        const dateTo = app.querySelector('#filter-dateTo').value;
        const params = new URLSearchParams();
        if (orderType) params.set('orderType', orderType);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        const q = params.toString();
        window.location.hash = '#/orders-list' + (q ? '?' + q : '');
      });
    }

    const resetBtn = app.querySelector('#reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        window.location.hash = '#/orders-list';
      });
    }

    bindDelete(app, '.cancel-order', { itemName: window.t('delete.order'),
      del, endpoint: '/orders/', successMsg: window.t('delete.order_cancelled'), listRoute: filterHash(),
      confirmTitle: window.t('orders.cancel_title'), confirmText: window.t('orders.cannot_undo'), confirmBtn: window.t('orders.yes_cancel')
    });
  } catch (err) { showError(app, err); }
});
