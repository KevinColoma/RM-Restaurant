import { registerRoute } from '../router.js';
import { showLoading, showError, renderPage, bindDelete, extractList, navigateTo, emptyState, currentPage, renderPagination } from '../lib/listPage.js';
import { get, del, post } from '../lib/api.js';

function filtersFromHash() {
  const q = window.location.hash.split('?')[1] || '';
  const params = new URLSearchParams(q);
  return {
    q: params.get('q') || ''
  };
}

function buildApiUrl() {
  const f = filtersFromHash();
  const params = new URLSearchParams();
  params.set('page', String(currentPage()));
  if (f.q) params.set('q', f.q);
  return '/suppliers?' + params.toString();
}

function filterHash() {
  const f = filtersFromHash();
  const params = new URLSearchParams();
  if (f.q) params.set('q', f.q);
  const p = params.toString();
  return '#/suppliers-list' + (p ? '?' + p : '');
}

registerRoute('/suppliers-list', async (app) => {
  showLoading(app);
  try {
    const suppliers = await get(buildApiUrl());
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

    const f = filtersFromHash();

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
</div>
<div class="card mb-0" id="filter_inputs" style="display:none">
<div class="card-body pb-0">
<div class="row">
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="filter.search">Search</label>
<input type="text" class="form-control" id="filter-q" data-i18n-placeholder="filter.search_name_contact" placeholder="Search by name or contact..." value="${f.q}">
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
                  .then(() => navigateTo(filterHash()));
              } else {
                Swal.fire(window.t('common.error'), res?.message || window.t('supplier.failed_add'), 'error');
              }
            }).catch(() => Swal.fire(window.t('common.error'), window.t('supplier.failed_add'), 'error'));
          }
        });
      });
      bindDelete(app, '.delete-supplier', { itemName: window.t('delete.supplier'), del, endpoint: '/suppliers/', successMsg: window.t('delete.supplier_deleted'), listRoute: filterHash() });
    }, 100);

    const applyBtn = app.querySelector('#apply-filters');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const q = app.querySelector('#filter-q').value;
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        const p = params.toString();
        window.location.hash = '#/suppliers-list' + (p ? '?' + p : '');
      });
    }

    const resetBtn = app.querySelector('#reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        window.location.hash = '#/suppliers-list';
      });
    }
  } catch (err) { showError(app, err); }
});