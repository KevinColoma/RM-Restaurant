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
    const table = app.querySelector('.datanew');
    // A "No X found" placeholder row uses a single colspan cell. Initializing
    // DataTables over it throws "Cannot set properties of undefined (setting
    // '_DT_CellIndex')", so only init when the body has real, per-column rows.
    const hasPlaceholder = table && table.querySelector('tbody td[colspan]');
    const $dt = $(table);
    if (table && !hasPlaceholder && $dt.length && !$.fn.DataTable.isDataTable($dt[0])) {
      $dt.DataTable({ pageLength: 10, bFilter: false });
    }
  }
  bindFilterToggle(app);
}

// The base template's script.js (which normally toggles #filter_inputs via
// jQuery) is injected as a <script> tag through innerHTML on every route
// change, and browsers never execute <script> elements inserted that way -
// so that delegated click handler never actually registers. Bind the
// filter toggle ourselves in plain JS so the button reliably opens/closes
// the panel regardless of whether jQuery ends up loaded.
export function bindFilterToggle(app) {
  const btn = app.querySelector('#filter_search');
  const panel = app.querySelector('#filter_inputs');
  if (!btn || !panel || btn.dataset.filterBound) return;
  btn.dataset.filterBound = 'true';
  panel.style.display = 'none';
  btn.addEventListener('click', () => {
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'block';
    btn.classList.toggle('setclose', !isOpen);
  });
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
              .then(() => navigateTo(listRoute));
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

// Renders the filter panel toggled by the "filter" button (#filter_search /
// #filter_inputs), styled consistently with the rest of the app: same
// card/row/col grid as every other section, and plain .form-control selects
// (the same class every other form in this app already uses) instead of
// the "select2" styling class, which isn't actually wired up anywhere in
// the build (select2.min.js/css are never loaded), so it always rendered
// as a broken, unstyled native dropdown.
export function renderFilterPanel(fields) {
  const cols = fields.map(f => `
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label>${f.label}</label>
<select class="form-control filter-field" data-field="${f.key}">
<option value="">${f.label}</option>
${f.options.map(o => `<option value="${String(o).replace(/"/g, '&quot;')}">${o}</option>`).join('')}
</select>
</div>
</div>`).join('');

  return `
<div class="card mb-0" id="filter_inputs">
<div class="card-body pb-0">
<div class="row">
${cols}
<div class="col-lg-3 col-sm-6 col-12 d-flex align-items-end">
<div class="form-group mb-0 d-flex">
<a class="btn btn-added" id="apply-filters" title="Apply filters"><img src="assets/img/icons/search-whites.svg" alt=""> Apply</a>
<a class="btn btn-cancel ms-2" id="reset-filters" title="Reset filters">&times; Reset</a>
</div>
</div>
</div>
</div>
</div>`;
}

// Wires the selects rendered by renderFilterPanel() to actually filter the
// in-memory dataset and re-render the table body, instead of being purely
// decorative.
export function bindFilterPanel(app, { data, renderRows, tbodySelector = '.datanew tbody', onRendered }) {
  const applyFilters = () => {
    const active = {};
    app.querySelectorAll('.filter-field').forEach(sel => {
      if (sel.value) active[sel.dataset.field] = sel.value.toLowerCase();
    });
    const filtered = Object.keys(active).length
      ? data.filter(item => Object.entries(active).every(([key, value]) => String(item[key] ?? '').toLowerCase() === value))
      : data;
    const tbody = app.querySelector(tbodySelector);
    if (tbody) tbody.innerHTML = renderRows(filtered);
    if (onRendered) onRendered(filtered);
  };

  const applyBtn = app.querySelector('#apply-filters');
  if (applyBtn) applyBtn.addEventListener('click', applyFilters);

  const resetBtn = app.querySelector('#reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      app.querySelectorAll('.filter-field').forEach(sel => { sel.value = ''; });
      applyFilters();
    });
  }

  app.querySelectorAll('.filter-field').forEach(sel => sel.addEventListener('change', applyFilters));
}

export function uniqueValues(items, key) {
  return [...new Set(items.map(i => i[key]).filter(v => v !== undefined && v !== null && v !== ''))];
}

// Forces a hashchange event even when navigating to the same route by appending
// a unique query parameter, ensuring the router re-renders with fresh data.
export function navigateTo(hash) {
  window.location.hash = hash + '?t=' + Date.now();
}
