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
      // Paging is off because the server now sends one page at a time; leaving
      // it on would show a second, unrelated pager over those rows. Sorting and
      // the length menu stay, as they still act on what is on screen.
      $dt.DataTable({ paging: false, info: false, bFilter: false });
    }
  }
  bindFilterToggle(app);
  bindPagination(app);
}

// Which page the current route is asking for. Kept in the URL so a page is
// shareable and the back button works; the router re-runs the route on every
// hash change, so switching pages just re-fetches.
export function currentPage() {
  const q = window.location.hash.split('?')[1] || '';
  const n = parseInt(new URLSearchParams(q).get('page'), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// Builds the URL for another page of the route we are already on, preserving
// any other query parameters that are present.
function pageHref(page) {
  const [base, q = ''] = window.location.hash.split('?');
  const params = new URLSearchParams(q);
  params.set('page', String(page));
  return base + '?' + params.toString();
}

// Renders the pager for a paginated response. Returns nothing when everything
// fits on one page, so small lists stay visually clean.
export function renderPagination(meta) {
  const pages = meta?.pages || 1;
  const page = meta?.page || 1;
  const total = meta?.total || 0;
  if (pages <= 1) return '';

  const from = (page - 1) * (meta.limit || 0) + 1;
  const to = Math.min(total, page * (meta.limit || 0));

  const boton = (p, etiqueta, disabled, extra = '') =>
    `<li class="page-item${disabled ? ' disabled' : ''}${extra}">
      <a class="page-link" href="${disabled ? 'javascript:void(0);' : pageHref(p)}"
         ${disabled ? 'tabindex="-1" aria-disabled="true"' : ''}>${etiqueta}</a>
    </li>`;

  // A window around the current page keeps the control usable when a list runs
  // to hundreds of pages instead of rendering one link per page.
  const desde = Math.max(1, page - 2);
  const hasta = Math.min(pages, desde + 4);
  let numeros = '';
  for (let p = desde; p <= hasta; p++) {
    numeros += `<li class="page-item${p === page ? ' active' : ''}">
      <a class="page-link" href="${pageHref(p)}" ${p === page ? 'aria-current="page"' : ''}>${p}</a>
    </li>`;
  }

  const _t = (typeof window !== 'undefined' && window.t) || (x => x);
  return `
<nav class="d-flex justify-content-between align-items-center flex-wrap mt-3" aria-label="Pagination">
  <small class="text-muted">${_t('common.showing')} ${from}-${to} ${_t('common.of')} ${total}</small>
  <ul class="pagination mb-0">
    ${boton(page - 1, '&laquo;', page === 1)}
    ${numeros}
    ${boton(page + 1, '&raquo;', page === pages)}
  </ul>
</nav>`;
}

// The pager is plain links, so the router handles navigation on its own. This
// only guards against a click on a disabled control changing the URL.
export function bindPagination(app) {
  app.querySelectorAll('.page-item.disabled .page-link').forEach(a => {
    a.addEventListener('click', e => e.preventDefault());
  });
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

// Reads the label of the row a button sits in, so a delete prompt can name the
// record instead of asking about an anonymous "it". Falls back to nothing when
// the row has no obvious label, and the generic wording is used instead.
function rowLabel(btn) {
  const row = btn.closest('tr');
  if (!row || !row.cells.length) return '';
  const first = row.cells[0].textContent.trim();
  return first.length > 60 ? first.slice(0, 57) + '...' : first;
}

export function bindDelete(app, selector, { del, endpoint, successMsg, listRoute,
    confirmTitle, confirmText, confirmBtn, itemName = 'record' }) {
  app.querySelectorAll(selector).forEach(btn => {
    btn.addEventListener('click', function () {
      const id = this.getAttribute('data-id');
      const label = rowLabel(this);

      // Naming the record is what makes this prompt worth reading - a generic
      // "Are you sure?" gets clicked through without being looked at.
      const title = confirmTitle || (label ? `Delete "${label}"?` : `Delete this ${itemName}?`);
      const text = confirmText ||
        `This ${itemName} will be permanently removed. This cannot be undone.`;

      Swal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: confirmBtn || `Yes, delete ${itemName}`,
        cancelButtonText: 'Cancel',
        focusCancel: true
      }).then(result => {
        if (!result.isConfirmed) return;

        Swal.fire({
          title: 'Deleting...',
          text: label ? `Removing "${label}"` : '',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        del(endpoint + id).then(() => {
          Swal.fire('Deleted', successMsg, 'success')
            .then(() => navigateTo(listRoute));
        }).catch(err => {
          Swal.fire('Could not delete', err.message || 'Please try again.', 'error');
        });
      });
    });
  });
}

// An empty table is a dead end unless it says what to do next, so this pairs
// the explanation with the action that resolves it.
export function emptyState({ colspan, title, hint, actionHref, actionLabel, i18nTitle, i18nHint, i18nAction }) {
  const boton = actionHref
    ? `<a href="${actionHref}" class="btn btn-added mt-2"${i18nAction ? ` data-i18n="${i18nAction}"` : ''}>${actionLabel || 'Add the first one'}</a>`
    : '';
  return `<tr><td colspan="${colspan}" class="text-center py-4">
    <p class="mb-1 fw-bold"${i18nTitle ? ` data-i18n="${i18nTitle}"` : ''}>${title}</p>
    ${hint ? `<p class="text-muted mb-2"${i18nHint ? ` data-i18n="${i18nHint}"` : ''}>${hint}</p>` : ''}
    ${boton}
  </td></tr>`;
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
<label data-i18n="filter.label">${f.label}</label>
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
<a class="btn btn-added" id="apply-filters" title="Apply filters" data-i18n-aria="common.filter"><img src="assets/img/icons/search-whites.svg" alt=""><span data-i18n="common.apply"> Apply</span></a>
<a class="btn btn-cancel ms-2" id="reset-filters" title="Reset filters" data-i18n-aria="common.filter">&times; <span data-i18n="common.reset">Reset</span></a>
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
