import { registerRoute } from '../router.js';
import { showLoading, showError, renderPage, bindDelete, extractList, renderFilterPanel, bindFilterPanel, uniqueValues, navigateTo, currentPage, renderPagination, emptyState } from '../lib/listPage.js';
import { get, put, del } from '../lib/api.js';

registerRoute('/branches-list', async (app) => {
  showLoading(app);
  try {
    const res = await get('/branches?page=' + currentPage());
    const branches = extractList(res, 'branches');

    const renderRows = (list) => list.length ? list.map(b => {
      return `<tr data-branch-id="${b._id}">
        <td class="br-restaurantName">${b.restaurantName || b.name || '-'}</td>
        <td class="br-Parent_Rest">${b.Parent_Rest || '-'}</td>
        <td class="br-ownerName">${b.ownerName || '-'}</td>
        <td class="br-city">${b.city || '-'}</td>
        <td class="br-address">${b.address || '-'}</td>
        <td class="br-email">${b.email || '-'}</td>
        <td class="br-mobile">${b.mobile || '-'}</td>
        <td>
          <a class="me-3 edit-branch" href="javascript:void(0);" aria-label="Edit branch" title="Edit branch" data-i18n-aria="action.edit_branch" data-id="${b._id}"><img src="assets/img/icons/edit.svg" alt=""></a>
          <a href="javascript:void(0);" class="delete-branch" aria-label="Delete branch" title="Delete branch" data-i18n-aria="action.delete_branch" data-id="${b._id}"><img src="assets/img/icons/delete.svg" alt=""></a>
        </td>
      </tr>`;
    }).join('') : emptyState({ colspan: 8, title: 'No branches registered', i18nTitle: 'empty.no_branches', hint: 'Add the locations this restaurant operates from.', i18nHint: 'empty.branches_hint', actionHref: '#/branches-add', actionLabel: 'Add the first branch', i18nAction: 'empty.branches_action' });

    const filterPanel = renderFilterPanel([
      { key: 'Parent_Rest', label: 'Parent Restaurant', options: uniqueValues(branches, 'Parent_Rest') },
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
<a href="#/branches-add" class="btn btn-added" data-i18n="branch.add_new"><img src="assets/img/icons/plus.svg" alt="" class="me-1">Add New Branch</a>
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
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="Download this list as a PDF" href="/export/branches/pdf"><img src="assets/img/icons/pdf.svg" alt=""></a></li>
<li><a data-bs-toggle="tooltip" data-bs-placement="top" title="Download this list as a spreadsheet (CSV)" href="/export/branches/csv"><img src="assets/img/icons/excel.svg" alt=""></a></li>
</ul>
</div>
</div>
${filterPanel}
<div class="table-responsive">
<table class="table datanew">
<thead>
<tr>
<th data-i18n="table.name">Branch Name</th>
<th data-i18n="branch.choose_parent">Parent Restaurant</th>
<th data-i18n="table.owner">Owner Name</th>
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
${renderPagination(res)}
</div>
</div>
</div>
</div>`;

    const bindBranchActions = () => {
      bindDelete(app, '.delete-branch', { itemName: 'branch', del, endpoint: '/branches/', successMsg: 'Branch has been deleted.', listRoute: '#/branches-list' });
      app.querySelectorAll('.edit-branch').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          const id = this.getAttribute('data-id');
          const row = app.querySelector(`[data-branch-id="${id}"]`);
          const restaurantName = row ? row.querySelector('.br-restaurantName').textContent : '';
          const Parent_Rest = row ? row.querySelector('.br-Parent_Rest').textContent : '';
          const ownerName = row ? row.querySelector('.br-ownerName').textContent : '';
          const city = row ? row.querySelector('.br-city').textContent : '';
          const address = row ? row.querySelector('.br-address').textContent : '';
          const email = row ? row.querySelector('.br-email').textContent : '';
          const mobile = row ? row.querySelector('.br-mobile').textContent : '';
          Swal.fire({
            title: window.t('branch.edit_branch'),
            html: `
              <input id="swal-restaurantName" class="swal2-input" value="${restaurantName}" placeholder="Restaurant Name" data-i18n-placeholder="form.restaurant_name">
              <input id="swal-Parent_Rest" class="swal2-input" value="${Parent_Rest}" placeholder="Parent Restaurant" data-i18n-placeholder="branch.choose_parent">
              <input id="swal-ownerName" class="swal2-input" value="${ownerName}" placeholder="Owner Name" data-i18n-placeholder="form.owner_name">
              <input id="swal-city" class="swal2-input" value="${city}" placeholder="City" data-i18n-placeholder="form.city">
              <input id="swal-address" class="swal2-input" value="${address}" placeholder="Address" data-i18n-placeholder="form.address">
              <input id="swal-email" class="swal2-input" value="${email}" placeholder="Email" data-i18n-placeholder="form.email">
              <input id="swal-mobile" class="swal2-input" value="${mobile}" placeholder="Mobile" data-i18n-placeholder="form.mobile">
            `,
            showCancelButton: true,
            confirmButtonText: window.t('common.update'),
            preConfirm: () => {
              return put('/branches/' + id, {
                restaurantName: document.getElementById('swal-restaurantName').value.trim(),
                Parent_Rest: document.getElementById('swal-Parent_Rest').value.trim(),
                ownerName: document.getElementById('swal-ownerName').value.trim(),
                city: document.getElementById('swal-city').value.trim(),
                address: document.getElementById('swal-address').value.trim(),
                email: document.getElementById('swal-email').value.trim(),
                mobile: document.getElementById('swal-mobile').value.trim()
              }).then(res => {
                if (res && !res.error) {
                  Swal.fire(window.t('common.success'), '', 'success').then(() => navigateTo('#/branches-list'));
                } else {
                  Swal.fire(window.t('common.error'), window.t('branch.updated_failed'), 'error');
                }
              }).catch(() => Swal.fire(window.t('common.error'), window.t('branch.updated_failed'), 'error'));
            }
          });
        });
      });
    };

    renderPage(app, 'branches-list', html);
    bindBranchActions();
    setTimeout(() => bindFilterPanel(app, { data: branches, renderRows, onRendered: bindBranchActions }), 100);
  } catch (err) { showError(app, err); }
});
