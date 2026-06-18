import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get, del } from '../lib/api.js';

registerRoute('/purchases-list', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';
  try {
    const res = await get('/purchases');
    const purchases = res?.success ? (res.purchases || res.data || []) : [];
    const rows = purchases.length ? purchases.map(p => {
      const date = p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-');
      const total = typeof p.totalAmount === 'number' ? p.totalAmount.toFixed(2) : (p.totalAmount || '0.00');
      const itemsCount = p.items ? p.items.length : 0;
      const supplierName = p.supplier?.name || 'N/A';
      return `<tr>
        <td>${supplierName}</td>
        <td>${itemsCount}</td>
        <td>${total}</td>
        <td>${date}</td>
        <td>${p.notes || ''}</td>
        <td>
          <a href="javascript:void(0);" class="delete-purchase" data-id="${p._id}"><img src="assets/img/icons/delete.svg" alt="img"></a>
        </td>
      </tr>`;
    }).join('') : '<tr><td colspan="6" class="text-center">No purchases found</td></tr>';

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="list.purchases_title">Purchase List</h4>
<h6 data-i18n="list.purchases_sub">View all purchases from suppliers</h6>
</div>
<div class="page-btn">
<a href="#/purchases-add" class="btn btn-added me-2"><img src="assets/img/icons/plus.svg" alt="img" class="me-1">Add Purchase</a>
<a href="/export/purchases/pdf" class="btn btn-added me-2"><img src="assets/img/icons/pdf.svg" alt="img" class="me-1">PDF</a>
<a href="/export/purchases/csv" class="btn btn-added"><img src="assets/img/icons/excel.svg" alt="img" class="me-1">CSV</a>
</div>
</div>
<div class="card">
<div class="card-body">
<div class="table-responsive">
<table class="table datanew">
<thead>
<tr>
<th data-i18n="table.supplier">Supplier</th>
<th data-i18n="table.items_count">Items</th>
<th data-i18n="table.total">Total Amount</th>
<th data-i18n="table.date">Date</th>
<th data-i18n="table.notes">Notes</th>
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

    renderLayout(app, 'purchases-list', html);

    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.DataTable) {
        const $dt = $(app.querySelector('.datanew'));
        if ($dt.length && !$.fn.DataTable.isDataTable($dt[0])) {
          $dt.DataTable({ pageLength: 10, bFilter: false });
        }
      }
      app.querySelectorAll('.delete-purchase').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          Swal.fire({
            title: 'Are you sure?',
            text: "This purchase record will be deleted.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
          }).then(result => {
            if (result.isConfirmed) {
              del('/purchases/' + id).then(() => {
                Swal.fire('Deleted!', 'Purchase has been deleted.', 'success')
                  .then(() => window.location.hash = '#/purchases-list');
              }).catch(err => {
                Swal.fire('Error!', err.message, 'error');
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
