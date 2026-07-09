import { registerRoute } from '../router.js';
import { showLoading, showError, renderPage, bindDelete, extractList, renderFilterPanel, bindFilterPanel, uniqueValues } from '../lib/listPage.js';
import { get, del } from '../lib/api.js';

registerRoute('/branches-list', async (app) => {
  showLoading(app);
  try {
    const res = await get('/branches');
    const branches = extractList(res, 'branches');

    const renderRows = (list) => list.length ? list.map(b => {
      return `<tr>
        <td>${b.restaurantName || b.name || '-'}</td>
        <td>${b.city || '-'}</td>
        <td>${b.address || '-'}</td>
        <td>${b.email || '-'}</td>
        <td>${b.mobile || '-'}</td>
        <td>
          <a href="javascript:void(0);" class="delete-branch" data-id="${b._id}"><img src="assets/img/icons/delete.svg" alt="img"></a>
        </td>
      </tr>`;
    }).join('') : '<tr><td colspan="6" class="text-center">No branches found</td></tr>';

    const filterPanel = renderFilterPanel([
      { key: 'city', label: 'Choose City', options: uniqueValues(branches, 'city') }
    ]);
    const rows = renderRows(branches);

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="list.branches_title">Branches List</h4>
<h6 data-i18n="list.branches_sub">Manage your branches</h6>
</div>
<div class="page-btn">
<a href="#/branches-add" class="btn btn-added"><img src="assets/img/icons/plus.svg" alt="img" class="me-1">Add New Branch</a>
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
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="pdf" href="/export/branches/pdf"><img src="assets/img/icons/pdf.svg" alt="img"></a></li>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="csv" href="/export/branches/csv"><img src="assets/img/icons/excel.svg" alt="img"></a></li>
</ul>
</div>
</div>
${filterPanel}
<div class="table-responsive">
<table class="table datanew">
<thead>
<tr>
<th data-i18n="table.name">Branch Name</th>
<th data-i18n="form.city">City</th>
<th data-i18n="table.address">Address</th>
<th data-i18n="table.email">Email</th>
<th data-i18n="table.mobile">Mobile</th>
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

    const bindBranchDelete = () => bindDelete(app, '.delete-branch', { del, endpoint: '/branches/', successMsg: 'Branch has been deleted.', listRoute: '#/branches-list' });

    renderPage(app, 'branches-list', html);
    bindBranchDelete();
    setTimeout(() => bindFilterPanel(app, { data: branches, renderRows, onRendered: bindBranchDelete }), 100);
  } catch (err) { showError(app, err); }
});
