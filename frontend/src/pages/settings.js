import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get, put } from '../lib/api.js';
import { setBusy } from '../lib/formFeedback.js';

registerRoute('/settings', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';

  try {
    const res = await get('/settings');
    const persona = res?.persona || res;

    const _t = (typeof window !== 'undefined' && window.t) || (x => x);
    const themeOpts = ['light', 'dark'].map(v =>
      `<option value="${v}" data-i18n="settings.${v}"${persona.theme === v ? ' selected' : ''}>${_t('settings.' + v)}</option>`
    ).join('');

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="settings.title">System Settings</h4>
<h6 data-i18n="settings.sub">Configure your restaurant system</h6>
</div>
</div>
<div class="card">
<div class="card-body">
<h4 class="card-title" data-i18n="settings.appearance">Appearance</h4>
<form id="settings-form">
<div class="row">
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label for="theme" data-i18n="settings.theme">Theme</label>
<select class="form-control" name="theme" id="theme">
${themeOpts}
</select>
</div>
</div>
</div>
<hr>
<h4 class="card-title mt-3" data-i18n="settings.billing">Billing</h4>
<div class="row">
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label for="taxRate" data-i18n="settings.tax_rate">Tax Rate (%)</label>
<input type="number" name="taxRate" id="taxRate" class="form-control" step="0.1" value="${persona.taxRate || 10}" required>
<small class="text-muted" data-i18n="settings.tax_rate_small">Applied automatically to all orders (default: 10%)</small>
</div>
</div>
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label for="currencySymbol" data-i18n="settings.currency">Currency Symbol</label>
<input type="text" name="currencySymbol" id="currencySymbol" class="form-control" maxlength="5" value="${persona.currencySymbol || '$'}" required>
</div>
</div>
</div>
<hr>
<h4 class="card-title mt-3" data-i18n="settings.printer_section">Printer</h4>
<div class="row">
<div class="col-lg-6 col-sm-12 col-12">
<div class="form-group">
<label for="printerConnection" data-i18n="settings.printer">Printer Connection String</label>
<input type="text" name="printerConnection" id="printerConnection" class="form-control" data-i18n-placeholder="settings.printer_placeholder" placeholder="e.g. USB/Vendor/Product or TCP/192.168.1.100" value="${persona.printerConnection || ''}">
<small class="text-muted" data-i18n="settings.printer_empty">Leave empty to disable printing. Format depends on your printer type.</small>
</div>
</div>
</div>
<div class="col-lg-12 mt-3">
<button type="submit" class="btn btn-submit me-2" data-i18n="settings.save">Save Settings</button>
</div>
</div>
</form>
</div>
</div>
</div>
</div>`;

    renderLayout(app, 'settings', html);

    document.getElementById('settings-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        theme: document.getElementById('theme').value,
        taxRate: document.getElementById('taxRate').value,
        currencySymbol: document.getElementById('currencySymbol').value,
        printerConnection: document.getElementById('printerConnection').value
      };
      // Unlike the create forms, saving settings keeps you on the page, so the
      // button has to be restored either way - hence the finally.
      const done = setBusy(e.submitter || e.target.querySelector('[type="submit"]'), window.t('settings.saving'));
      try {
        const res = await put('/settings', data);
        if (res.success) {
          Swal.fire(window.t('settings.saved_title'), window.t('settings.saved_text'), 'success');
          const theme = data.theme;
          if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            localStorage.setItem('rms-theme', 'dark');
          } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('rms-theme', 'light');
          }
        } else {
          Swal.fire(window.t('settings.save_error'), res.error || window.t('settings.save_failed'), 'error');
        }
      } catch (err) {
        Swal.fire(window.t('settings.save_error'), err.message || window.t('settings.save_failed'), 'error');
      } finally {
        done();
      }
    });
  } catch (err) {
    app.innerHTML = `<div class="page-wrapper"><div class="content"><p class="text-danger">Failed to load: ${err.message}</p></div></div>`;
  }
});
