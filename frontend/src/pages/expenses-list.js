import { registerRoute } from '../router.js';
import { showLoading, showError, renderPage, bindDelete, extractList, currentPage, renderPagination, emptyState } from '../lib/listPage.js';
import { get, del } from '../lib/api.js';

function filtersFromHash() {
  const q = window.location.hash.split('?')[1] || '';
  const params = new URLSearchParams(q);
  return {
    category: params.get('category') || '',
    paymentMethod: params.get('paymentMethod') || '',
    dateFrom: params.get('dateFrom') || '',
    dateTo: params.get('dateTo') || '',
    q: params.get('q') || ''
  };
}

function buildApiUrl() {
  const f = filtersFromHash();
  const params = new URLSearchParams();
  params.set('page', String(currentPage()));
  if (f.category) params.set('category', f.category);
  if (f.paymentMethod) params.set('paymentMethod', f.paymentMethod);
  if (f.dateFrom) params.set('dateFrom', f.dateFrom);
  if (f.dateTo) params.set('dateTo', f.dateTo);
  if (f.q) params.set('q', f.q);
  return '/expenses?' + params.toString();
}

function filterHash() {
  const f = filtersFromHash();
  const params = new URLSearchParams();
  if (f.category) params.set('category', f.category);
  if (f.paymentMethod) params.set('paymentMethod', f.paymentMethod);
  if (f.dateFrom) params.set('dateFrom', f.dateFrom);
  if (f.dateTo) params.set('dateTo', f.dateTo);
  if (f.q) params.set('q', f.q);
  const p = params.toString();
  return '#/expenses-list' + (p ? '?' + p : '');
}

registerRoute('/expenses-list', async (app) => {
  showLoading(app);
  try {
    const res = await get(buildApiUrl());
    const expenses = extractList(res, 'expenses');

    const renderRows = (list) => list.length ? list.map(e => {
      const date = e.expenseDate ? new Date(e.expenseDate).toDateString() : (e.createdAt ? new Date(e.createdAt).toDateString() : '-');
      const amount = typeof e.amount === 'number' ? e.amount.toFixed(2) : (e.amount || '0.00');
      return `<tr>
        <td>${e.expenseType || '-'}</td>
        <td>${amount}</td>
        <td>${date}</td>
        <td>${e.category || '-'}</td>
        <td>${e.vendor || '-'}</td>
        <td>${e.invoiceNumber || '-'}</td>
        <td>
          <a class="me-3" aria-label="Edit expense" title="Edit expense" data-i18n-aria="action.edit_expense" href="#/expenses-edit/${e._id}"><img src="assets/img/icons/edit.svg" alt=""></a>
          <a href="javascript:void(0);" class="delete-expense" aria-label="Delete expense" title="Delete expense" data-i18n-aria="action.delete_expense" data-id="${e._id}"><img src="assets/img/icons/delete.svg" alt=""></a>
        </td>
      </tr>`;
    }).join('') : emptyState({ colspan: 7, title: 'No expenses recorded yet', i18nTitle: 'empty.no_expenses', hint: 'Track what the restaurant spends to see it reflected in your reports.', i18nHint: 'empty.expense_hint', actionHref: '#/expenses-add', actionLabel: 'Record the first expense', i18nAction: 'empty.expense_action' });

    const f = filtersFromHash();

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="list.expense_title">Expense List</h4>
<h6 data-i18n="list.expense_sub">Manage your expenses</h6>
</div>
<div class="page-btn">
<a href="#/expenses-add" class="btn btn-added" data-i18n="list.add_new_expense"><img src="assets/img/icons/plus.svg" alt="" class="me-1">Add New Expense</a>
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
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="Download this list as a PDF" href="/export/expenses/pdf"><img src="assets/img/icons/pdf.svg" alt=""></a></li>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="Download this list as a spreadsheet (CSV)" href="/export/expenses/csv"><img src="assets/img/icons/excel.svg" alt=""></a></li>
</ul>
</div>
</div>
<div class="card mb-0" id="filter_inputs" style="display:none">
<div class="card-body pb-0">
<div class="row">
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="filter.search">Search</label>
<input type="text" class="form-control" id="filter-q" data-i18n-placeholder="filter.search_desc_vendor" placeholder="Search description, vendor..." value="${f.q}">
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
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="filter.payment_method">Payment Method</label>
<select class="form-control" id="filter-paymentMethod">
<option value="" data-i18n="filter.all">All</option>
<option value="cash" data-i18n="filter.cash"${f.paymentMethod === 'cash' ? ' selected' : ''}>Cash</option>
<option value="credit card" data-i18n="filter.credit_card"${f.paymentMethod === 'credit card' ? ' selected' : ''}>Credit Card</option>
<option value="bank transfer" data-i18n="filter.bank_transfer"${f.paymentMethod === 'bank transfer' ? ' selected' : ''}>Bank Transfer</option>
<option value="other" data-i18n="filter.other"${f.paymentMethod === 'other' ? ' selected' : ''}>Other</option>
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
<th data-i18n="table.category">Expense Type</th>
<th data-i18n="table.total">Amount</th>
<th data-i18n="table.date">Date</th>
<th data-i18n="table.category">Category</th>
<th data-i18n="table.supplier">Vendor</th>
<th data-i18n="table.invoice">Invoice</th>
<th data-i18n="table.action">Actions</th>
</tr>
</thead>
<tbody>${renderRows(expenses)}</tbody>
</table>
</div>
${renderPagination(res)}
</div>
</div>
</div>
</div>`;

    const bindExpenseDelete = () => bindDelete(app, '.delete-expense', { itemName: window.t('delete.expense'), del, endpoint: '/expense/', successMsg: window.t('delete.expense_deleted'), listRoute: filterHash() });

    renderPage(app, 'expenses-list', html);
    bindExpenseDelete();

    const applyBtn = app.querySelector('#apply-filters');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const q = app.querySelector('#filter-q').value;
        const dateFrom = app.querySelector('#filter-dateFrom').value;
        const dateTo = app.querySelector('#filter-dateTo').value;
        const paymentMethod = app.querySelector('#filter-paymentMethod').value;
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        if (paymentMethod) params.set('paymentMethod', paymentMethod);
        const p = params.toString();
        window.location.hash = '#/expenses-list' + (p ? '?' + p : '');
      });
    }

    const resetBtn = app.querySelector('#reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        window.location.hash = '#/expenses-list';
      });
    }
  } catch (err) { showError(app, err); }
});