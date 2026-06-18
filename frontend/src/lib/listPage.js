import { renderLayout } from '../components/Header.js';

export function showLoading(app) {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';
}

export function showError(app, err) {
  app.innerHTML = `<div class="page-wrapper"><div class="content"><p class="text-danger">Failed to load: ${err.message}</p></div></div>`;
}

export function renderPage(app, pageName, html) {
  renderLayout(app, pageName, html);
  setTimeout(setupPage, 100, app);
}

function setupPage(app) {
  if (typeof $ !== 'undefined' && $.fn.DataTable) {
    const $dt = $(app.querySelector('.datanew'));
    if ($dt.length && !$.fn.DataTable.isDataTable($dt[0])) {
      $dt.DataTable({ pageLength: 10, bFilter: false });
    }
  }
}

export function bindDelete(app, selector, { del, endpoint, successMsg, listRoute,
    confirmTitle, confirmText, confirmBtn }) {
  app.querySelectorAll(selector).forEach(btn => {
    btn.addEventListener('click', function () {
      const id = this.getAttribute('data-id');
      Swal.fire({
        title: confirmTitle || 'Are you sure?',
        text: confirmText || "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: confirmBtn || 'Yes, delete it!'
      }).then(result => {
        if (result.isConfirmed) {
          del(endpoint + id).then(() => {
            Swal.fire('Deleted!', successMsg, 'success')
              .then(() => window.location.hash = listRoute);
          }).catch(err => {
            Swal.fire('Error!', 'Failed to delete: ' + err.message, 'error');
          });
        }
      });
    });
  });
}

export function extractList(res, key, fallback) {
  return res?.success ? (res[key] || res.data || fallback || []) : (fallback || []);
}
