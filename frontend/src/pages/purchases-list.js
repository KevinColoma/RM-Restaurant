import { registerRoute } from '../router.js';
import { showLoading, showError, renderPage, bindDelete, extractList, currentPage, renderPagination, emptyState } from '../lib/listPage.js';
import { get, del } from '../lib/api.js';

registerRoute('/purchases-list', async (app) => {
  showLoading(app);
  try {
    const res = await get('/purchases?page=' + currentPage());
    const purchases = extractList(res, 'purchases');
    const rows = purchases.length ? purchases.map(p => {
      const date = p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-');
      const total = typeof p.totalAmount === 'number' ? p.totalAmount.toFixed(2) : (p.totalAmount || '0.00');
      const itemsDetail = p.items ? p.items.map(i => i.itemName + ' x' + i.quantity).join(', ') : '-';
      const supplierName = p.supplier?.name || 'N/A';
      return `<tr>
        <td>${date}</td>
        <td>${supplierName}</td>
        <td>${itemsDetail}</td>
        <td>${total}</td>
        <td>${p.notes || ''}</td>
        <td>
          <a href="javascript:void(0);" class="delete-purchase" aria-label="Delete purchase" title="Delete purchase" data-i18n-aria="action.delete_purchase" data-id="${p._id}"><img src="assets/img/icons/delete.svg" alt=""></a>
        </td>
      </tr>`;
    }).join('') : emptyState({ colspan: 6, title: 'No purchases recorded', hint: 'Record what you buy from suppliers to keep stock and costs up to date.', actionHref: '#/purchases-add', actionLabel: 'Record the first purchase' });

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="list.purchases_title">Purchase List</h4>
<h6 data-i18n="list.purchases_sub">View all purchases from suppliers</h6>
</div>
<div class="page-btn">
<a href="#/purchases-add" class="btn btn-added me-2"><img src="assets/img/icons/plus.svg" alt="" class="me-1">Add Purchase</a>
<a href="/export/purchases/pdf" class="btn btn-added me-2"><img src="assets/img/icons/pdf.svg" alt="" class="me-1">PDF</a>
<a href="/export/purchases/csv" class="btn btn-added"><img src="assets/img/icons/excel.svg" alt="" class="me-1">CSV</a>
</div>
</div>
<div class="card">
<div class="card-body">
<div class="table-responsive">
<table class="table datanew">
<thead>
<tr>
<th data-i18n="table.date">Date</th>
<th data-i18n="table.supplier">Supplier</th>
<th data-i18n="table.items">Items</th>
<th data-i18n="table.total">Total Amount</th>
<th data-i18n="table.notes">Notes</th>
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

    renderPage(app, 'purchases-list', html);
    bindDelete(app, '.delete-purchase', { del, endpoint: '/purchases/', successMsg: 'Purchase has been deleted.', listRoute: '#/purchases-list' });
  } catch (err) { showError(app, err); }
});
