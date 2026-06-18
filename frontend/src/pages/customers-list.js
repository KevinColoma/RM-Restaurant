import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get, put, del } from '../lib/api.js';

registerRoute('/customers-list', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';
  try {
    const res = await get('/customers');
    const customers = res?.success ? (res.customers || res.data || []) : [];
    const rows = customers.length ? customers.map(c => {
      const date = c.createdAt ? new Date(c.createdAt).toDateString() : '-';
      return `<tr data-customer-id="${c._id}">
        <td class="cust-name">${c.name || '-'}</td>
        <td class="cust-phone">${c.phone || '-'}</td>
        <td class="cust-address">${c.address || '-'}</td>
        <td>${c.orders ? c.orders.length : 0}</td>
        <td>${date}</td>
        <td>
          <a class="me-3" href="javascript:void(0);" class="edit-customer" data-id="${c._id}"><img src="assets/img/icons/edit.svg" alt="img"></a>
          <a href="javascript:void(0);" class="delete-customer" data-id="${c._id}"><img src="assets/img/icons/delete.svg" alt="img"></a>
        </td>
      </tr>`;
    }).join('') : '<tr><td colspan="6" class="text-center">No customers found</td></tr>';

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="list.customers_title">Customers List</h4>
<h6 data-i18n="list.customers_sub">Manage your customers</h6>
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
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="pdf" href="/export/customers/pdf"><img src="assets/img/icons/pdf.svg" alt="img"></a></li>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="csv" href="/export/customers/csv"><img src="assets/img/icons/excel.svg" alt="img"></a></li>
</ul>
</div>
</div>
<div class="table-responsive">
<table class="table datanew">
<thead>
<tr>
<th data-i18n="table.name">Name</th>
<th data-i18n="table.phone">Phone</th>
<th data-i18n="table.address">Address</th>
<th data-i18n="table.orders_count">Orders</th>
<th data-i18n="table.created_date">Created Date</th>
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

    renderLayout(app, 'customers-list', html);

    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.DataTable) {
        const $dt = $(app.querySelector('.datanew'));
        if ($dt.length && !$.fn.DataTable.isDataTable($dt[0])) {
          $dt.DataTable({ pageLength: 10, bFilter: false });
        }
      }

      app.querySelectorAll('.edit-customer').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          const id = this.getAttribute('data-id') || this.closest('a')?.getAttribute('data-id');
          const row = app.querySelector(`[data-customer-id="${id}"]`);
          const name = row ? row.querySelector('.cust-name').textContent : '';
          const phone = row ? row.querySelector('.cust-phone').textContent : '';
          const address = row ? row.querySelector('.cust-address').textContent : '';
          Swal.fire({
            title: 'Edit Customer',
            html: `
              <input id="swal-name" class="swal2-input" value="${name}" placeholder="Name">
              <input id="swal-phone" class="swal2-input" value="${phone}" placeholder="Phone">
              <input id="swal-address" class="swal2-input" value="${address}" placeholder="Address">
            `,
            showCancelButton: true,
            confirmButtonText: 'Update',
            preConfirm: () => {
              return put('/customers/' + id, {
                name: document.getElementById('swal-name').value,
                phone: document.getElementById('swal-phone').value,
                address: document.getElementById('swal-address').value
              }).then(res => {
                if (res && !res.error) {
                  Swal.fire('Updated!', '', 'success').then(() => window.location.hash = '#/customers-list');
                } else {
                  Swal.fire('Error!', 'Failed to update.', 'error');
                }
              }).catch(() => {
                Swal.fire('Error!', 'Failed to update.', 'error');
              });
            }
          });
        });
      });

      app.querySelectorAll('.delete-customer').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
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
              del('/customers/' + id).then(() => {
                Swal.fire('Deleted!', 'Customer has been deleted.', 'success')
                  .then(() => window.location.hash = '#/customers-list');
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
