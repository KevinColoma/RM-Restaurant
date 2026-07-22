import { registerRoute } from '../router.js';
import { showLoading, showError, renderPage, bindDelete, extractList, currentPage, renderPagination, emptyState } from '../lib/listPage.js';
import { get, del } from '../lib/api.js';

registerRoute('/orders-list', async (app) => {
  showLoading(app);
  try {
    const res = await get('/orders?page=' + currentPage());
    const orders = extractList(res, 'orders');
    const rows = orders.length ? orders.map(o => {
      const items = o.items ? o.items.map(i => i.menuItem ? i.menuItem.item : 'Unknown').join(', ') : '-';
      const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-';
      return `<tr>
        <td>${o._id || '-'}</td>
        <td>${items}</td>
        <td>${typeof o.totalAmount === 'number' ? o.totalAmount.toFixed(2) : (o.totalAmount || '0.00')}</td>
        <td>${o.taxAmount !== undefined ? (typeof o.taxAmount === 'number' ? o.taxAmount.toFixed(2) : o.taxAmount) : '-'}</td>
        <td>${o.orderType || '-'}</td>
        <td>${o.comment || '-'}</td>
        <td>${date}</td>
        <td>
          <a href="javascript:void(0);" class="btn btn-sm btn-danger cancel-order" data-id="${o._id}">Cancel</a>
        </td>
      </tr>`;
    }).join('') : emptyState({ colspan: 8, title: 'No orders yet', hint: 'Orders appear here once you start billing.', actionHref: '#/pos', actionLabel: 'Go to billing' });

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="list.orders_title">Orders List</h4>
<h6 data-i18n="list.orders_sub">Manage your orders</h6>
</div>
<div class="page-btn">
<a href="/export/orders/pdf" class="btn btn-added me-2"><img src="assets/img/icons/pdf.svg" alt="" class="me-1">PDF</a>
<a href="/export/orders/csv" class="btn btn-added"><img src="assets/img/icons/excel.svg" alt="" class="me-1">CSV</a>
</div>
</div>
<div class="card">
<div class="card-body">
<div class="table-responsive">
<table class="table datanew">
<thead>
<tr>
<th data-i18n="table.order_id">Order ID</th>
<th data-i18n="table.items">Items</th>
<th data-i18n="table.total">Total</th>
<th>Tax</th>
<th data-i18n="table.order_type">Type</th>
<th>Comment</th>
<th data-i18n="table.date">Date</th>
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

    renderPage(app, 'orders-list', html);
    bindDelete(app, '.cancel-order', { itemName: 'order',
      del, endpoint: '/orders/', successMsg: 'Order has been cancelled.', listRoute: '#/orders-list',
      confirmTitle: 'Cancel Order?', confirmText: 'This action cannot be undone!', confirmBtn: 'Yes, cancel it!'
    });
  } catch (err) { showError(app, err); }
});
