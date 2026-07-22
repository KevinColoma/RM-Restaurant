import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get, post } from '../lib/api.js';
import { navigateTo } from '../lib/listPage.js';
import { setBusy } from '../lib/formFeedback.js';

registerRoute('/inventory-add', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';

  try {
    const supplierRes = await get('/suppliers');
    const suppliers = Array.isArray(supplierRes) ? supplierRes : (supplierRes?.suppliers || supplierRes?.data || []);

    const supplierOpts = suppliers.length
      ? suppliers.map(s => `<option value="${s._id}">${s.name}</option>`).join('')
      : '<option value="">No suppliers available</option>';

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4>Inventory Add</h4>
<h6>Create new inventory item</h6>
</div>
</div>
<div class="card">
<div class="card-body">
<form id="add-inventory-form">
<div class="row">
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label for="name">Item Name</label>
<input type="text" name="name" id="name" class="form-control" required>
</div>
</div>
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label for="quantity">Quantity</label>
<input type="number" name="quantity" id="quantity" class="form-control" min="0" step="1" required>
</div>
</div>
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label for="price">Price</label>
<input type="number" name="price" id="price" step="0.01" min="0" class="form-control" required>
</div>
</div>
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label for="supplier">Supplier</label>
<select class="form-control" name="supplier" id="supplier" required>
<option value="">Choose Supplier</option>
${supplierOpts}
</select>
</div>
</div>
<div class="col-lg-12">
<button type="submit" class="btn btn-submit me-2">Submit</button>
<a href="#/inventory-list" class="btn btn-cancel">Cancel</a>
</div>
</div>
</form>
</div>
</div>
</div>
</div>`;

    renderLayout(app, 'inventory-add', html);

    document.getElementById('add-inventory-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById('name').value,
        quantity: document.getElementById('quantity').value,
        price: document.getElementById('price').value,
        supplier: document.getElementById('supplier').value
      };
      const done = setBusy(e.submitter || e.target.querySelector('[type="submit"]'), 'Saving item...');
      try {
        await post('/inventory', data);
        Swal.fire('Success!', 'Inventory item added successfully.', 'success')
          .then(() => navigateTo('#/inventory-list'));
      } catch (err) {
        done();
        Swal.fire('Error!', err.message || 'Failed to add item.', 'error');
      }
    });
  } catch (err) {
    app.innerHTML = `<div class="page-wrapper"><div class="content"><p class="text-danger">Failed to load: ${err.message}</p></div></div>`;
  }
});
