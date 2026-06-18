import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get, del } from '../lib/api.js';

registerRoute('/inventory-list', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';
  try {
    const res = await get('/inventory');
    const items = res?.success ? (res.inventoryItems || res.data || []) : [];
    const rows = items.length ? items.map(item => {
      const price = typeof item.price === 'number' ? item.price.toFixed(2) : (item.price || '0.00');
      const supplierName = item.supplier?.name || '-';
      return `<tr>
        <td class="productimgname"><a href="javascript:void(0);">${item.name || ''}</a></td>
        <td>${supplierName}</td>
        <td>${item.quantity || 0}</td>
        <td>${price}</td>
        <td>${supplierName}</td>
        <td>
          <a class="me-3" href="#/inventory-edit/${item._id}"><img src="assets/img/icons/edit.svg" alt="img"></a>
          <a href="javascript:void(0);" class="delete-item" data-id="${item._id}"><img src="assets/img/icons/delete.svg" alt="img"></a>
        </td>
      </tr>`;
    }).join('') : '<tr><td colspan="6" class="text-center">No inventory items found</td></tr>';

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="list.inventory_title">Inventory List</h4>
<h6 data-i18n="list.inventory_sub">Manage your inventory</h6>
</div>
<div class="page-btn">
<a href="#/inventory-add" class="btn btn-added"><img src="assets/img/icons/plus.svg" alt="img" class="me-1">Add New Item</a>
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
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="pdf" href="/export/inventory/pdf"><img src="assets/img/icons/pdf.svg" alt="img"></a></li>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="csv" href="/export/inventory/csv"><img src="assets/img/icons/excel.svg" alt="img"></a></li>
</ul>
</div>
</div>
<div class="table-responsive">
<table class="table datanew">
<thead>
<tr>
<th data-i18n="table.name">Item Name</th>
<th data-i18n="table.category">Category</th>
<th data-i18n="table.qty">Quantity</th>
<th data-i18n="table.price">Price</th>
<th data-i18n="table.supplier">Supplier</th>
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

    renderLayout(app, 'inventory-list', html);

    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.DataTable) {
        const $dt = $(app.querySelector('.datanew'));
        if ($dt.length && !$.fn.DataTable.isDataTable($dt[0])) {
          $dt.DataTable({ pageLength: 10, bFilter: false });
        }
      }
      app.querySelectorAll('.delete-item').forEach(btn => {
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
              del('/inventory/' + id).then(() => {
                Swal.fire('Deleted!', 'Inventory item has been deleted.', 'success')
                  .then(() => window.location.hash = '#/inventory-list');
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
