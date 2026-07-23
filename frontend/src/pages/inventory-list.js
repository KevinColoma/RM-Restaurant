import { registerRoute } from '../router.js';
import { showLoading, showError, renderPage, bindDelete, extractList, renderFilterPanel, bindFilterPanel, uniqueValues, currentPage, renderPagination, emptyState } from '../lib/listPage.js';
import { get, del } from '../lib/api.js';

registerRoute('/inventory-list', async (app) => {
  showLoading(app);
  try {
    const res = await get('/inventory?page=' + currentPage());
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
          <a class="me-3" aria-label="Edit inventory item" title="Edit inventory item" data-i18n-aria="action.edit_inventory" href="#/inventory-edit/${item._id}"><img src="assets/img/icons/edit.svg" alt=""></a>
          <a href="javascript:void(0);" class="delete-item" aria-label="Delete inventory item" title="Delete inventory item" data-i18n-aria="action.delete_inventory" data-id="${item._id}"><img src="assets/img/icons/delete.svg" alt=""></a>
        </td>
      </tr>`;
    }).join('') : emptyState({ colspan: 6, title: 'No inventory items yet', i18nTitle: 'empty.no_inventory', hint: 'Add stock to keep track of what you have on hand.', i18nHint: 'empty.inventory_hint', actionHref: '#/inventory-add', actionLabel: 'Add the first item', i18nAction: 'empty.inventory_action' });

    const filterableItems = items.map(item => ({ ...item, supplierName: item.supplier?.name || '' }));
    const filterPanel = renderFilterPanel([
      { key: 'supplierName', label: 'Supplier', options: uniqueValues(filterableItems, 'supplierName') }
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
<a href="#/inventory-add" class="btn btn-added" data-i18n="list.add_new_inventory"><img src="assets/img/icons/plus.svg" alt="" class="me-1">Add New Item</a>
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
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="Download this list as a PDF" href="/export/inventory/pdf"><img src="assets/img/icons/pdf.svg" alt=""></a></li>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="Download this list as a spreadsheet (CSV)" href="/export/inventory/csv"><img src="assets/img/icons/excel.svg" alt=""></a></li>
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
${renderPagination(res)}
</div>
</div>
</div>
</div>`;

    const bindItemDelete = () => bindDelete(app, '.delete-item', { itemName: 'inventory item', del, endpoint: '/inventory/', successMsg: 'Inventory item has been deleted.', listRoute: '#/inventory-list' });

    renderPage(app, 'inventory-list', html);
    bindItemDelete();
    setTimeout(() => bindFilterPanel(app, { data: filterableItems, renderRows, onRendered: bindItemDelete }), 100);
  } catch (err) { showError(app, err); }
});
