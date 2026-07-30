import { registerRoute } from '../router.js';
import { showLoading, showError, renderPage, bindDelete, extractList, currentPage, renderPagination, emptyState } from '../lib/listPage.js';
import { get, del } from '../lib/api.js';

function filtersFromHash() {
  const q = window.location.hash.split('?')[1] || '';
  const params = new URLSearchParams(q);
  return {
    category: params.get('category') || '',
    subCategory: params.get('subCategory') || '',
    availability: params.get('availability') || '',
    q: params.get('q') || ''
  };
}

function buildApiUrl() {
  const f = filtersFromHash();
  const params = new URLSearchParams();
  params.set('page', String(currentPage()));
  if (f.category) params.set('category', f.category);
  if (f.subCategory) params.set('subCategory', f.subCategory);
  if (f.availability) params.set('availability', f.availability);
  if (f.q) params.set('q', f.q);
  return '/menu?' + params.toString();
}

function filterHash() {
  const f = filtersFromHash();
  const params = new URLSearchParams();
  if (f.category) params.set('category', f.category);
  if (f.subCategory) params.set('subCategory', f.subCategory);
  if (f.availability) params.set('availability', f.availability);
  if (f.q) params.set('q', f.q);
  const p = params.toString();
  return '#/menu-list' + (p ? '?' + p : '');
}

registerRoute('/menu-list', async (app) => {
  showLoading(app);
  try {
    const res = await get(buildApiUrl());
    const menus = extractList(res, 'menus');

    const renderRows = (list) => list.length ? list.map(m => {
      const price = typeof m.price === 'number' ? m.price.toFixed(2) : (m.price || '0.00');
      const available = m.available !== undefined ? m.available : (m.status !== 'inactive');
      const badge = available ? '<span class="badge bg-success">' + (window.t ? window.t('menu.available') : 'Available') + '</span>' : '<span class="badge bg-danger">' + (window.t ? window.t('dash.unavailable') : 'Unavailable') + '</span>';
      return `<tr>
        <td class="productimgname"><a href="javascript:void(0);">${m.item || ''}</a></td>
        <td>${m.category || '-'}</td>
        <td>${m.subCategory || '-'}</td>
        <td>${price}</td>
        <td>${badge}</td>
        <td>
          <a class="me-3" aria-label="Edit menu item" title="Edit menu item" data-i18n-aria="action.edit_menu" href="#/menu-edit/${m._id}"><img src="assets/img/icons/edit.svg" alt=""></a>
          <a href="javascript:void(0);" class="delete-item" aria-label="Delete menu item" title="Delete menu item" data-i18n-aria="action.delete_menu" data-id="${m._id}"><img src="assets/img/icons/delete.svg" alt=""></a>
        </td>
      </tr>`;
    }).join('') : emptyState({ colspan: 6, title: 'Your menu is empty', i18nTitle: 'empty.your_menu_empty', hint: 'Add dishes so they can be sold from the billing screen.', i18nHint: 'empty.menu_hint', actionHref: '#/menu-add', actionLabel: 'Add the first dish', i18nAction: 'empty.menu_action' });

    const f = filtersFromHash();

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="list.product_title">Product List</h4>
<h6 data-i18n="list.product_sub">Manage your products</h6>
</div>
<div class="page-btn">
<a href="#/menu-add" class="btn btn-added" data-i18n="list.add_new_item"><img src="assets/img/icons/plus.svg" alt="" class="me-1">Add New Item</a>
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
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="Download this list as a PDF" href="/export/menu/pdf"><img src="assets/img/icons/pdf.svg" alt=""></a></li>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="Download this list as a spreadsheet (CSV)" href="/export/menu/csv"><img src="assets/img/icons/excel.svg" alt=""></a></li>
</ul>
</div>
</div>
<div class="card mb-0" id="filter_inputs" style="display:none">
<div class="card-body pb-0">
<div class="row">
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="filter.category">Category</label>
<select class="form-control" id="filter-category">
<option value="" data-i18n="filter.all_categories">All Categories</option>
<option value="Veg" data-i18n="menu.veg"${f.category === 'Veg' ? ' selected' : ''}>Veg</option>
<option value="Non-Veg" data-i18n="menu.non_veg"${f.category === 'Non-Veg' ? ' selected' : ''}>Non-Veg</option>
</select>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="filter.subcategory">Sub Category</label>
<select class="form-control" id="filter-subCategory">
<option value="" data-i18n="filter.all_subcategories">All Sub Categories</option>
<option value="Starter"${f.subCategory === 'Starter' ? ' selected' : ''}>Starter</option>
<option value="Main Course"${f.subCategory === 'Main Course' ? ' selected' : ''}>Main Course</option>
<option value="Beverage"${f.subCategory === 'Beverage' ? ' selected' : ''}>Beverage</option>
<option value="Soup"${f.subCategory === 'Soup' ? ' selected' : ''}>Soup</option>
<option value="Salad"${f.subCategory === 'Salad' ? ' selected' : ''}>Salad</option>
<option value="Roti"${f.subCategory === 'Roti' ? ' selected' : ''}>Roti</option>
<option value="Rice"${f.subCategory === 'Rice' ? ' selected' : ''}>Rice</option>
<option value="Dessert"${f.subCategory === 'Dessert' ? ' selected' : ''}>Dessert</option>
<option value="Juice"${f.subCategory === 'Juice' ? ' selected' : ''}>Juice</option>
<option value="Snack"${f.subCategory === 'Snack' ? ' selected' : ''}>Snack</option>
<option value="Side Dish"${f.subCategory === 'Side Dish' ? ' selected' : ''}>Side Dish</option>
</select>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="filter.availability">Availability</label>
<select class="form-control" id="filter-availability">
<option value="" data-i18n="filter.all">All</option>
<option value="true" data-i18n="dash.available"${f.availability === 'true' ? ' selected' : ''}>Available</option>
<option value="false" data-i18n="dash.unavailable"${f.availability === 'false' ? ' selected' : ''}>Unavailable</option>
</select>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="filter.search">Search</label>
<input type="text" class="form-control" id="filter-q" data-i18n-placeholder="filter.search_item" placeholder="Search item..." value="${f.q}">
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
<th data-i18n="table.name">Item Name</th>
<th data-i18n="table.category">Category</th>
<th data-i18n="table.subcategory">Sub Category</th>
<th data-i18n="table.price">Price</th>
<th data-i18n="table.availability">Availability</th>
<th data-i18n="table.action">Actions</th>
</tr>
</thead>
<tbody>${renderRows(menus)}</tbody>
</table>
</div>
${renderPagination(res)}
</div>
</div>
</div>
</div>`;

    const bindItemDelete = () => bindDelete(app, '.delete-item', { itemName: window.t('delete.menu_item'), del, endpoint: '/menu/', successMsg: window.t('delete.menu_item_deleted'), listRoute: filterHash() });

    renderPage(app, 'menu-list', html);
    bindItemDelete();

    const applyBtn = app.querySelector('#apply-filters');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const category = app.querySelector('#filter-category').value;
        const subCategory = app.querySelector('#filter-subCategory').value;
        const availability = app.querySelector('#filter-availability').value;
        const q = app.querySelector('#filter-q').value;
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (subCategory) params.set('subCategory', subCategory);
        if (availability) params.set('availability', availability);
        if (q) params.set('q', q);
        const p = params.toString();
        window.location.hash = '#/menu-list' + (p ? '?' + p : '');
      });
    }

    const resetBtn = app.querySelector('#reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        window.location.hash = '#/menu-list';
      });
    }
  } catch (err) { showError(app, err); }
});