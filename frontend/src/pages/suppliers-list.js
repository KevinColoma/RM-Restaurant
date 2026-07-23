import { registerRoute } from '../router.js';
import { showLoading, showError, renderPage, bindDelete, extractList, navigateTo, emptyState, currentPage, renderPagination } from '../lib/listPage.js';
import { get, del, post } from '../lib/api.js';

registerRoute('/suppliers-list', async (app) => {
  showLoading(app);
  try {
    const suppliers = await get('/suppliers?page=' + currentPage());
    const list = Array.isArray(suppliers) ? suppliers : extractList(suppliers, 'suppliers');
    const rows = list.length ? list.map(s => {
      const contact = [s.email, s.phone, s.address].filter(Boolean).join(', ') || '-';
      return `<tr>
        <td>${s.name || '-'}</td>
        <td>${contact}</td>
        <td>
          <a href="javascript:void(0);" class="delete-supplier" aria-label="Delete supplier" title="Delete supplier" data-i18n-aria="action.delete_supplier" data-id="${s._id}"><img src="assets/img/icons/delete.svg" alt=""></a>
        </td>
      </tr>`;
    }).join('') : emptyState({ colspan: 3, title: 'No suppliers yet', i18nTitle: 'empty.no_suppliers', hint: 'Add suppliers so you can assign them to inventory and purchases.', i18nHint: 'empty.suppliers_hint' });

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="list.suppliers_title">Suppliers List</h4>
<h6 data-i18n="list.suppliers_sub">Manage your suppliers</h6>
</div>
<div class="page-btn">
<a href="/export/suppliers/pdf" class="btn btn-added me-2"><img src="assets/img/icons/pdf.svg" alt="" class="me-1">PDF</a>
<a href="/export/suppliers/csv" class="btn btn-added"><img src="assets/img/icons/excel.svg" alt="" class="me-1">CSV</a>
</div>
</div>
<div class="card">
<div class="card-body">
<div class="table-responsive">
<table class="table datanew">
<thead>
<tr>
<th data-i18n="table.name">Name</th>
<th data-i18n="table.contact_info">Contact Info</th>
<th data-i18n="table.action">Actions</th>
</tr>
</thead>
<tbody>${rows}</tbody>
</table>
</div>
${renderPagination(suppliers)}
<hr>
<div class="text-end">
<button class="btn btn-primary" id="addSupplierBtn" data-i18n="supplier.add_title"><img src="assets/img/icons/plus.svg" alt="" class="me-1">Add New Supplier</button>
</div>
</div>
</div>
</div>
</div>`;

    renderPage(app, 'suppliers-list', html);

    setTimeout(() => {
      app.querySelector('#addSupplierBtn').addEventListener('click', function() {
        Swal.fire({
          title: window.t('supplier.add_title'),
          html: `
            <input id="swal-name" class="swal2-input" placeholder="Supplier Name" data-i18n-placeholder="supplier.name_placeholder">
            <input id="swal-email" type="email" class="swal2-input" placeholder="Email" data-i18n-placeholder="supplier.email_placeholder">
            <input id="swal-phone" class="swal2-input" placeholder="Phone" data-i18n-placeholder="supplier.phone_placeholder">
            <input id="swal-address" class="swal2-input" placeholder="Address" data-i18n-placeholder="supplier.address_placeholder">
          `,
          showCancelButton: true,
          confirmButtonText: window.t('supplier.save_button'),
          preConfirm: () => {
            const nameVal = document.getElementById('swal-name').value.trim();
            const phoneVal = document.getElementById('swal-phone').value.trim();
            if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nameVal)) {
              Swal.showValidationMessage(window.t('supplier.name_letters'));
              return false;
            }
            if (phoneVal && !/^[0-9+\-\s]+$/.test(phoneVal)) {
              Swal.showValidationMessage(window.t('supplier.phone_digits'));
              return false;
            }
            return post('/suppliers', {
              name: nameVal,
              email: document.getElementById('swal-email').value,
              phone: phoneVal,
              address: document.getElementById('swal-address').value
            }).then(res => {
              if (res && !res.error) {
                Swal.fire(window.t('common.success'), window.t('supplier.added'), 'success')
                  .then(() => navigateTo('#/suppliers-list'));
              } else {
                Swal.fire(window.t('common.error'), res?.message || window.t('supplier.failed_add'), 'error');
              }
            }).catch(() => Swal.fire(window.t('common.error'), window.t('supplier.failed_add'), 'error'));
          }
        });
      });
      bindDelete(app, '.delete-supplier', { itemName: 'supplier', del, endpoint: '/suppliers/', successMsg: 'Supplier has been deleted.', listRoute: '#/suppliers-list' });
    }, 100);
  } catch (err) { showError(app, err); }
});
