import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get, del } from '../lib/api.js';

registerRoute('/expenses-list', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';
  try {
    const res = await get('/expenses');
    const expenses = res?.success ? (res.expenses || res.data || []) : [];
    const rows = expenses.length ? expenses.map(e => {
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
          <a class="me-3" href="#/expenses-edit/${e._id}"><img src="assets/img/icons/edit.svg" alt="img"></a>
          <a href="javascript:void(0);" class="delete-expense" data-id="${e._id}"><img src="assets/img/icons/delete.svg" alt="img"></a>
        </td>
      </tr>`;
    }).join('') : '<tr><td colspan="7" class="text-center">No expenses found</td></tr>';

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="list.expense_title">Expense List</h4>
<h6 data-i18n="list.expense_sub">Manage your expenses</h6>
</div>
<div class="page-btn">
<a href="#/expenses-add" class="btn btn-added"><img src="assets/img/icons/plus.svg" alt="img" class="me-1">Add New Expense</a>
</div>
</div>
<div class="card">
<div class="card-body">
<div class="table-top">
<div class="search-set">
<div class="search-path">
<a class="btn btn-filter" id="filter_search">
<img src="assets/img/icons/filter.svg" alt="img">
<span><img src="assets/img/icons/closes.svg" alt="img"></span>
</a>
</div>
<div class="search-input">
<a class="btn btn-searchset"><img src="assets/img/icons/search-white.svg" alt="img"></a>
</div>
</div>
<div class="wordset">
<ul>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="pdf" href="/export/expenses/pdf"><img src="assets/img/icons/pdf.svg" alt="img"></a></li>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="csv" href="/export/expenses/csv"><img src="assets/img/icons/excel.svg" alt="img"></a></li>
</ul>
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
<tbody>${rows}</tbody>
</table>
</div>
</div>
</div>
</div>
</div>`;

    renderLayout(app, 'expenses-list', html);

    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.DataTable) {
        const $dt = $(app.querySelector('.datanew'));
        if ($dt.length && !$.fn.DataTable.isDataTable($dt[0])) {
          $dt.DataTable({ pageLength: 10, bFilter: false });
        }
      }
      app.querySelectorAll('.delete-expense').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
          }).then(result => {
            if (result.isConfirmed) {
              del('/expense/' + id).then(() => {
                Swal.fire('Deleted!', 'Expense has been deleted.', 'success')
                  .then(() => window.location.hash = '#/expenses-list');
              }).catch(err => {
                Swal.fire('Error!', 'Failed to delete: ' + err.message, 'error');
              });
            }
          });
        });
      });
    }, 100);
  } catch (err) {
    app.innerHTML = `<div class="page-wrapper"><div class="content"><p class="text-danger">Failed to load: ${err.message}</p></div></div>`;
  }
});
