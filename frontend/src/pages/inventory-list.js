import { registerRoute } from '../router.js';
import { showLoading, showError, renderPage, bindDelete, extractList, renderFilterPanel, bindFilterPanel, uniqueValues } from '../lib/listPage.js';
import { get, del } from '../lib/api.js';

registerRoute('/inventory-list', async (app) => {
  showLoading(app);
  try {
    const res = await get('/inventory');
    const items = extractList(res, 'inventoryItems');

    const renderRows = (list) => list.length ? list.map(item => {
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
    }).join('') : '<tr><td colspan="6" class="text-center" data-i18n="table.no_inventory">No inventory items found</td></tr>';

    const filterableItems = items.map(item => ({ ...item, supplierName: item.supplier?.name || '' }));
    const filterPanel = renderFilterPanel([
      { key: 'supplierName', label: 'Choose Supplier', options: uniqueValues(filterableItems, 'supplierName') }
    ]);
    const rows = renderRows(items);

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
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="print" onclick="window.print()"><img src="assets/img/icons/printer.svg" alt="img"></a></li>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="pdf" href="/export/inventory/pdf"><img src="assets/img/icons/pdf.svg" alt="img"></a></li>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="csv" href="/export/inventory/csv"><img src="assets/img/icons/excel.svg" alt="img"></a></li>
</ul>
</div>
</div>
${filterPanel}
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

    const bindItemDelete = () => bindDelete(app, '.delete-item', { del, endpoint: '/inventory/', successMsg: 'Inventory item has been deleted.', listRoute: '#/inventory-list' });

    renderPage(app, 'inventory-list', html);
    bindItemDelete();
    setTimeout(() => bindFilterPanel(app, { data: filterableItems, renderRows, onRendered: bindItemDelete }), 100);
  } catch (err) { showError(app, err); }
});
