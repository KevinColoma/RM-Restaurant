import { registerRoute } from '../router.js';
import { showLoading, showError, renderPage, bindDelete, extractList } from '../lib/listPage.js';
import { get, del, post } from '../lib/api.js';

registerRoute('/suppliers-list', async (app) => {
  showLoading(app);
  try {
    const suppliers = await get('/suppliers');
    const list = Array.isArray(suppliers) ? suppliers : extractList(suppliers, 'suppliers');
    const rows = list.length ? list.map(s => {
      const contact = [s.email, s.phone, s.address].filter(Boolean).join(', ') || '-';
      return `<tr>
        <td>${s.name || '-'}</td>
        <td>${contact}</td>
        <td>
          <a href="javascript:void(0);" class="delete-supplier" data-id="${s._id}"><img src="assets/img/icons/delete.svg" alt="img"></a>
        </td>
      </tr>`;
    }).join('') : '<tr><td colspan="3" class="text-center">No suppliers found</td></tr>';

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="list.suppliers_title">Suppliers List</h4>
<h6 data-i18n="list.suppliers_sub">Manage your suppliers</h6>
</div>
<div class="page-btn">
<a href="/export/suppliers/pdf" class="btn btn-added me-2"><img src="assets/img/icons/pdf.svg" alt="img" class="me-1">PDF</a>
<a href="/export/suppliers/csv" class="btn btn-added"><img src="assets/img/icons/excel.svg" alt="img" class="me-1">CSV</a>
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
<hr>
<div class="text-end">
<button class="btn btn-primary" id="addSupplierBtn"><img src="assets/img/icons/plus.svg" alt="img" class="me-1">Add New Supplier</button>
</div>
</div>
</div>
</div>
</div>`;

    renderPage(app, 'suppliers-list', html);

    setTimeout(() => {
      app.querySelector('#addSupplierBtn').addEventListener('click', function() {
        Swal.fire({
          title: 'Add New Supplier',
          html: `
            <input id="swal-name" class="swal2-input" placeholder="Supplier Name">
            <input id="swal-email" class="swal2-input" placeholder="Email">
            <input id="swal-phone" class="swal2-input" placeholder="Phone">
            <input id="swal-address" class="swal2-input" placeholder="Address">
          `,
          showCancelButton: true,
          confirmButtonText: 'Save',
          preConfirm: () => {
            return post('/suppliers', {
              name: document.getElementById('swal-name').value,
              email: document.getElementById('swal-email').value,
              phone: document.getElementById('swal-phone').value,
              address: document.getElementById('swal-address').value
            }).then(res => {
              if (res && !res.error) {
                Swal.fire('Added!', 'Supplier has been added.', 'success')
                  .then(() => window.location.hash = '#/suppliers-list');
              } else {
                Swal.fire('Error!', res?.message || 'Failed to add supplier.', 'error');
              }
            }).catch(() => Swal.fire('Error!', 'Failed to add supplier.', 'error'));
          }
        });
      });
      bindDelete(app, '.delete-supplier', { del, endpoint: '/suppliers/', successMsg: 'Supplier has been deleted.', listRoute: '#/suppliers-list' });
    }, 100);
  } catch (err) { showError(app, err); }
});
