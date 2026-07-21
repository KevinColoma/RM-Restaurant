import { registerRoute } from '../router.js';
import { showLoading, showError, renderPage, bindDelete, extractList, renderFilterPanel, bindFilterPanel, navigateTo } from '../lib/listPage.js';
import { get, post, put, del } from '../lib/api.js';

registerRoute('/customers-list', async (app) => {
  showLoading(app);
  try {
    const res = await get('/customers');
    const customers = extractList(res, 'customers');

    const renderRows = (list) => list.length ? list.map(c => {
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
    }).join('') : '<tr><td colspan="6" class="text-center" data-i18n="table.no_customers">No customers found</td></tr>';

    const filterableCustomers = customers.map(c => ({ ...c, ordersStatus: c.orders && c.orders.length ? 'Has Orders' : 'No Orders' }));
    const filterPanel = renderFilterPanel([
      { key: 'ordersStatus', label: 'Orders', options: ['Has Orders', 'No Orders'] }
    ]);
    const rows = renderRows(customers);

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="list.customers_title">Customers List</h4>
<h6 data-i18n="list.customers_sub">Manage your customers</h6>
</div>
<div class="page-btn">
<a href="javascript:void(0);" class="btn btn-added" id="addCustomerBtn"><img src="assets/img/icons/plus.svg" alt="img" class="me-1">Add New Customer</a>
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
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="print" onclick="window.print()"><img src="assets/img/icons/printer.svg" alt="img"></a></li>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="pdf" href="/export/customers/pdf"><img src="assets/img/icons/pdf.svg" alt="img"></a></li>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="csv" href="/export/customers/csv"><img src="assets/img/icons/excel.svg" alt="img"></a></li>
</ul>
</div>
</div>
${filterPanel}
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

    const bindCustomerActions = () => {
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
              const nameVal = document.getElementById('swal-name').value.trim();
              const phoneVal = document.getElementById('swal-phone').value.trim();
              if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nameVal)) {
                Swal.showValidationMessage('Name can only contain letters');
                return false;
              }
              if (phoneVal && !/^[0-9+\-\s]+$/.test(phoneVal)) {
                Swal.showValidationMessage('Phone can only contain numbers');
                return false;
              }
              return put('/customers/' + id, {
                name: nameVal,
                phone: phoneVal,
                address: document.getElementById('swal-address').value
              }).then(res => {
                if (res && !res.error) {
                  Swal.fire('Updated!', '', 'success').then(() => navigateTo('#/customers-list'));
                } else {
                  Swal.fire('Error!', 'Failed to update.', 'error');
                }
              }).catch(() => Swal.fire('Error!', 'Failed to update.', 'error'));
            }
          });
        });
      });
      bindDelete(app, '.delete-customer', { del, endpoint: '/customers/', successMsg: 'Customer has been deleted.', listRoute: '#/customers-list' });
    };

    renderPage(app, 'customers-list', html);
    setTimeout(() => {
      app.querySelector('#addCustomerBtn').addEventListener('click', function() {
        Swal.fire({
          title: 'Add New Customer',
          html: `
            <input id="swal-name" class="swal2-input" placeholder="Customer Name">
            <input id="swal-phone" class="swal2-input" placeholder="Phone">
            <input id="swal-address" class="swal2-input" placeholder="Address">
          `,
          showCancelButton: true,
          confirmButtonText: 'Save',
          preConfirm: () => {
            const nameVal = document.getElementById('swal-name').value.trim();
            if (!nameVal) {
              Swal.showValidationMessage('Name is required');
              return false;
            }
            return post('/customers', {
              name: nameVal,
              phone: document.getElementById('swal-phone').value.trim(),
              address: document.getElementById('swal-address').value.trim()
            }).then(res => {
              if (res && !res.error) {
                Swal.fire('Added!', 'Customer has been added.', 'success')
                  .then(() => navigateTo('#/customers-list'));
              } else {
                Swal.fire('Error!', res?.message || 'Failed to add customer.', 'error');
              }
            }).catch(() => Swal.fire('Error!', 'Failed to add customer.', 'error'));
          }
        });
      });
      bindCustomerActions();
      bindFilterPanel(app, { data: filterableCustomers, renderRows, onRendered: bindCustomerActions });
    }, 100);
  } catch (err) { showError(app, err); }
});
