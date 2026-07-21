import { registerRoute } from '../router.js';
import { showLoading, showError, renderPage, bindDelete, extractList, renderFilterPanel, bindFilterPanel, uniqueValues } from '../lib/listPage.js';
import { get, del } from '../lib/api.js';

registerRoute('/menu-list', async (app) => {
  showLoading(app);
  try {
    const res = await get('/menu');
    const menus = extractList(res, 'menus');

    const renderRows = (list) => list.length ? list.map(m => {
      const price = typeof m.price === 'number' ? m.price.toFixed(2) : (m.price || '0.00');
      const available = m.available !== undefined ? m.available : (m.status !== 'inactive');
      const badge = available ? '<span class="badge bg-success">Available</span>' : '<span class="badge bg-danger">Unavailable</span>';
      return `<tr>
        <td class="productimgname"><a href="javascript:void(0);">${m.item || ''}</a></td>
        <td>${m.category || '-'}</td>
        <td>${m.subCategory || '-'}</td>
        <td>${price}</td>
        <td>${badge}</td>
        <td>
          <a class="me-3" href="#/menu-edit/${m._id}"><img src="assets/img/icons/edit.svg" alt="img"></a>
          <a href="javascript:void(0);" class="delete-item" data-id="${m._id}"><img src="assets/img/icons/delete.svg" alt="img"></a>
        </td>
      </tr>`;
    }).join('') : '<tr><td colspan="6" class="text-center" data-i18n="table.no_menu_items">No menu items found</td></tr>';

    const filterPanel = renderFilterPanel([
      { key: 'category', label: 'Choose Category', options: uniqueValues(menus, 'category') },
      { key: 'subCategory', label: 'Choose Sub Category', options: uniqueValues(menus, 'subCategory') }
    ]);
    const rows = renderRows(menus);

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="list.product_title">Product List</h4>
<h6 data-i18n="list.product_sub">Manage your products</h6>
</div>
<div class="page-btn">
<a href="#/menu-add" class="btn btn-added"><img src="assets/img/icons/plus.svg" alt="img" class="me-1">Add New Item</a>
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
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="pdf" href="/export/menu/pdf"><img src="assets/img/icons/pdf.svg" alt="img"></a></li>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="csv" href="/export/menu/csv"><img src="assets/img/icons/excel.svg" alt="img"></a></li>
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
<th data-i18n="table.subcategory">Sub Category</th>
<th data-i18n="table.price">Price</th>
<th data-i18n="table.availability">Availability</th>
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

    const bindItemDelete = () => bindDelete(app, '.delete-item', { del, endpoint: '/menu/', successMsg: 'Menu item has been deleted.', listRoute: '#/menu-list' });

    renderPage(app, 'menu-list', html);
    bindItemDelete();
    setTimeout(() => bindFilterPanel(app, { data: menus, renderRows, onRendered: bindItemDelete }), 100);
  } catch (err) { showError(app, err); }
});
