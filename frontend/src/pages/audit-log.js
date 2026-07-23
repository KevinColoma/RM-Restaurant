import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get } from '../lib/api.js';
import { currentPage, renderPagination } from '../lib/listPage.js';

registerRoute('/audit-log', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';
  try {
    const res = await get('/audit-log?page=' + currentPage());
    const logs = res?.success ? (res.logs || res.data || []) : [];
    const rows = logs.length ? logs.map(log => {
      const date = log.createdAt ? new Date(log.createdAt).toLocaleString() : '-';
      let badge = '';
      switch (log.action) {
        case 'create': badge = '<span class="badge bg-success">Create</span>'; break;
        case 'update': case 'settings_update': badge = '<span class="badge bg-warning text-dark">Update</span>'; break;
        case 'delete': badge = '<span class="badge bg-danger">Delete</span>'; break;
        case 'cancel': badge = '<span class="badge bg-secondary">Cancel</span>'; break;
        case 'login': badge = '<span class="badge bg-info text-dark">Login</span>'; break;
        case 'logout': badge = '<span class="badge bg-dark">Logout</span>'; break;
        case 'password_change': badge = '<span class="badge bg-primary">Password</span>'; break;
        default: badge = log.action || '-';
      }
      return `<tr>
        <td>${badge}</td>
        <td>${log.collection || '-'}</td>
        <td>${log.documentId || '-'}</td>
        <td>${log.details || ''}</td>
        <td>${date}</td>
      </tr>`;
    }).join('') : '<tr><td colspan="5" class="text-center" data-i18n="table.no_activity">No activity recorded yet.</td></tr>';

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="audit.title">Audit Log</h4>
<h6 data-i18n="audit.sub">Complete activity history</h6>
</div>
</div>
<div class="card">
<div class="card-body">
<div class="table-responsive">
<table class="table datatable">
<thead>
<tr>
<th data-i18n="audit.action">Action</th>
<th data-i18n="audit.collection">Collection</th>
<th data-i18n="audit.document_id">Document ID</th>
<th data-i18n="audit.details">Details</th>
<th data-i18n="audit.datetime">Date / Time</th>
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

    renderLayout(app, 'audit-log', html);

    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.DataTable) {
        const $dt = $(app.querySelector('.datatable'));
        if ($dt.length && !$.fn.DataTable.isDataTable($dt[0])) {
          $dt.DataTable({ pageLength: 10, bFilter: false });
        }
      }
    }, 100);
  } catch (err) {
    app.innerHTML = `<div class="page-wrapper"><div class="content"><p class="text-danger">Failed to load: ${err.message}</p></div></div>`;
  }
});
