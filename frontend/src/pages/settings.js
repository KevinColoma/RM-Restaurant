import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get, put } from '../lib/api.js';

registerRoute('/settings', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';

  try {
    const res = await get('/settings');
    const persona = res?.persona || res;

    const themeOpts = ['light', 'dark'].map(t =>
      `<option value="${t}"${persona.theme === t ? ' selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`
    ).join('');

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4>System Settings</h4>
<h6>Configure your restaurant system</h6>
</div>
</div>
<div class="card">
<div class="card-body">
<h4 class="card-title">Appearance</h4>
<form id="settings-form">
<div class="row">
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label for="theme">Theme</label>
<select class="form-control" name="theme" id="theme">
${themeOpts}
</select>
</div>
</div>
</div>
<hr>
<h4 class="card-title mt-3">Billing</h4>
<div class="row">
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label for="taxRate">Tax Rate (%)</label>
<input type="number" name="taxRate" id="taxRate" class="form-control" step="0.1" value="${persona.taxRate || 10}" required>
<small class="text-muted">Applied automatically to all orders (default: 10%)</small>
</div>
</div>
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label for="currencySymbol">Currency Symbol</label>
<input type="text" name="currencySymbol" id="currencySymbol" class="form-control" maxlength="5" value="${persona.currencySymbol || '$'}" required>
</div>
</div>
</div>
<hr>
<h4 class="card-title mt-3">Printer</h4>
<div class="row">
<div class="col-lg-6 col-sm-12 col-12">
<div class="form-group">
<label for="printerConnection">Printer Connection String</label>
<input type="text" name="printerConnection" id="printerConnection" class="form-control" placeholder="e.g. USB/Vendor/Product or TCP/192.168.1.100" value="${persona.printerConnection || ''}">
<small class="text-muted">Leave empty to disable printing. Format depends on your printer type.</small>
</div>
</div>
</div>
<div class="col-lg-12 mt-3">
<button type="submit" class="btn btn-submit me-2">Save Settings</button>
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
      try {
        const res = await put('/settings', data);
        if (res.success) {
          Swal.fire('Success!', 'Settings saved successfully.', 'success');
          const theme = data.theme;
          if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            localStorage.setItem('rms-theme', 'dark');
          } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('rms-theme', 'light');
          }
        } else {
          Swal.fire('Error!', res.error || 'Failed to save settings.', 'error');
        }
      } catch (err) {
        Swal.fire('Error!', err.message || 'Failed to save settings.', 'error');
      }
    });
  } catch (err) {
    app.innerHTML = `<div class="page-wrapper"><div class="content"><p class="text-danger">Failed to load: ${err.message}</p></div></div>`;
  }
});
