import { registerRoute } from '../router.js';
import { showLoading, showError, renderPage, bindDelete, extractList, renderFilterPanel, bindFilterPanel, navigateTo, currentPage, renderPagination, emptyState } from '../lib/listPage.js';
import { get, post, put, del } from '../lib/api.js';

registerRoute('/customers-list', async (app) => {
  showLoading(app);
  try {
    const res = await get('/customers?page=' + currentPage());
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
          <a class="me-3 edit-customer" href="javascript:void(0);" aria-label="Edit customer" title="Edit customer" data-i18n-aria="action.edit_customer" data-id="${c._id}"><img src="assets/img/icons/edit.svg" alt=""></a>
          <a href="javascript:void(0);" class="delete-customer" aria-label="Delete customer" title="Delete customer" data-i18n-aria="action.delete_customer" data-id="${c._id}"><img src="assets/img/icons/delete.svg" alt=""></a>
        </td>
      </tr>`;
    }).join('') : emptyState({ colspan: 6, title: 'No customers yet', i18nTitle: 'empty.no_customers', hint: 'Customers are added automatically when you take an order in billing.', i18nHint: 'empty.customers_hint', actionHref: '#/pos', actionLabel: 'Go to billing', i18nAction: 'empty.customers_action' });

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
<a href="javascript:void(0);" class="btn btn-added" id="addCustomerBtn" data-i18n="list.add_new_customer"><img src="assets/img/icons/plus.svg" alt="" class="me-1">Add New Customer</a>
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
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="Download this list as a PDF" href="/export/customers/pdf"><img src="assets/img/icons/pdf.svg" alt=""></a></li>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="Download this list as a spreadsheet (CSV)" href="/export/customers/csv"><img src="assets/img/icons/excel.svg" alt=""></a></li>
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
${renderPagination(res)}
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
            title: window.t('customer.edit_title'),
            html: `
              <input id="swal-name" class="swal2-input" value="${name}" placeholder="Name" data-i18n-placeholder="form.customer_name">
              <input id="swal-phone" class="swal2-input" value="${phone}" placeholder="Phone" data-i18n-placeholder="form.phone">
              <input id="swal-address" class="swal2-input" value="${address}" placeholder="Address" data-i18n-placeholder="form.address">
            `,
            showCancelButton: true,
            confirmButtonText: window.t('common.update'),
            preConfirm: () => {
              const nameVal = document.getElementById('swal-name').value.trim();
              const phoneVal = document.getElementById('swal-phone').value.trim();
              if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nameVal)) {
                Swal.showValidationMessage(window.t('customer.name_letters'));
                return false;
              }
              if (phoneVal && !/^[0-9+\-\s]+$/.test(phoneVal)) {
                Swal.showValidationMessage(window.t('customer.phone_digits'));
                return false;
              }
              return put('/customers/' + id, {
                name: nameVal,
                phone: phoneVal,
                address: document.getElementById('swal-address').value
              }).then(res => {
                if (res && !res.error) {
                  Swal.fire(window.t('common.success'), '', 'success').then(() => navigateTo('#/customers-list'));
                } else {
                  Swal.fire(window.t('common.error'), window.t('customer.updated_failed'), 'error');
                }
              }).catch(() => Swal.fire(window.t('common.error'), window.t('customer.updated_failed'), 'error'));
            }
          });
        });
      });
      bindDelete(app, '.delete-customer', { itemName: 'customer', del, endpoint: '/customers/', successMsg: 'Customer has been deleted.', listRoute: '#/customers-list' });
    };

    renderPage(app, 'customers-list', html);
    setTimeout(() => {
      app.querySelector('#addCustomerBtn').addEventListener('click', function() {
        Swal.fire({
          title: window.t('customer.add_title'),
          html: `
            <input id="swal-name" class="swal2-input" placeholder="Customer Name" data-i18n-placeholder="form.customer_name">
            <input id="swal-phone" class="swal2-input" placeholder="Phone" data-i18n-placeholder="form.phone">
            <input id="swal-address" class="swal2-input" placeholder="Address" data-i18n-placeholder="form.address">
          `,
          showCancelButton: true,
          confirmButtonText: window.t('customer.save_button'),
          preConfirm: () => {
            const nameVal = document.getElementById('swal-name').value.trim();
            if (!nameVal) {
              Swal.showValidationMessage(window.t('customer.name_required'));
              return false;
            }
            return post('/customers', {
              name: nameVal,
              phone: document.getElementById('swal-phone').value.trim(),
              address: document.getElementById('swal-address').value.trim()
            }).then(res => {
              if (res && !res.error) {
                Swal.fire(window.t('common.success'), window.t('customer.added'), 'success')
                  .then(() => navigateTo('#/customers-list'));
              } else {
                Swal.fire(window.t('common.error'), res?.message || window.t('customer.failed_add'), 'error');
              }
            }).catch(() => Swal.fire(window.t('common.error'), window.t('customer.failed_add'), 'error'));
          }
        });
      });
      bindCustomerActions();
      bindFilterPanel(app, { data: filterableCustomers, renderRows, onRendered: bindCustomerActions });
    }, 100);
  } catch (err) { showError(app, err); }
});
