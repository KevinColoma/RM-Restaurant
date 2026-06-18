import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get, del } from '../lib/api.js';

registerRoute('/orders-list', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';
  try {
    const res = await get('/orders');
    const orders = res?.success ? (res.orders || res.data || []) : [];
    const rows = orders.length ? orders.map(o => {
      const items = o.items ? o.items.map(i => i.menuItem ? i.menuItem.item : 'Unknown').join(', ') : '-';
      const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-';
      return `<tr>
        <td>${o._id || '-'}</td>
        <td>${items}</td>
        <td>${typeof o.totalAmount === 'number' ? o.totalAmount.toFixed(2) : (o.totalAmount || '0.00')}</td>
        <td>${o.orderType || '-'}</td>
        <td>${date}</td>
        <td>
          <a href="javascript:void(0);" class="btn btn-sm btn-danger cancel-order" data-id="${o._id}">Cancel</a>
        </td>
      </tr>`;
    }).join('') : '<tr><td colspan="6" class="text-center">No orders found</td></tr>';

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="list.orders_title">Orders List</h4>
<h6 data-i18n="list.orders_sub">Manage your orders</h6>
</div>
<div class="page-btn">
<a href="/export/orders/pdf" class="btn btn-added me-2"><img src="assets/img/icons/pdf.svg" alt="img" class="me-1">PDF</a>
<a href="/export/orders/csv" class="btn btn-added"><img src="assets/img/icons/excel.svg" alt="img" class="me-1">CSV</a>
</div>
</div>
<div class="card">
<div class="card-body">
<div class="table-responsive">
<table class="table datanew">
<thead>
<tr>
<th data-i18n="table.order_id">Order ID</th>
<th data-i18n="table.items">Items</th>
<th data-i18n="table.total">Total</th>
<th data-i18n="table.order_type">Type</th>
<th data-i18n="table.date">Date</th>
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

    renderLayout(app, 'orders-list', html);

    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.DataTable) {
        const $dt = $(app.querySelector('.datanew'));
        if ($dt.length && !$.fn.DataTable.isDataTable($dt[0])) {
          $dt.DataTable({ pageLength: 10, bFilter: false });
        }
      }
      app.querySelectorAll('.cancel-order').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          Swal.fire({
            title: 'Cancel Order?',
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, cancel it!'
          }).then(result => {
            if (result.isConfirmed) {
              del('/orders/' + id).then(() => {
                Swal.fire('Cancelled!', 'Order has been cancelled.', 'success')
                  .then(() => window.location.hash = '#/orders-list');
              }).catch(err => {
                Swal.fire('Error!', 'Failed to cancel order: ' + err.message, 'error');
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
