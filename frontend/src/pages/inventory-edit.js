import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get, put } from '../lib/api.js';
import { navigateTo } from '../lib/listPage.js';
import { setBusy } from '../lib/formFeedback.js';

registerRoute('/inventory-edit/', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';

  const id = window.location.hash.replace('#/inventory-edit/', '');
  if (!id) {
    app.innerHTML = '<div class="page-wrapper"><div class="content"><p class="text-danger">Invalid inventory item ID.</p></div></div>';
    return;
  }

  try {
    const res = await get('/inventory/edit/' + id);
    const { item, suppliers } = res || {};
    if (!item) {
      app.innerHTML = '<div class="page-wrapper"><div class="content"><p class="text-danger">Inventory item not found.</p></div></div>';
      return;
    }

    const supplierOpts = (suppliers || []).map(s => {
      const selected = item.supplier && (item.supplier.toString() === s._id.toString() || item.supplier._id === s._id) ? ' selected' : '';
      return `<option value="${s._id}"${selected}>${s.name}</option>`;
    }).join('');

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4>Edit Inventory Item</h4>
<h6>Update item details</h6>
</div>
</div>
<div class="card">
<div class="card-body">
<form id="edit-inventory-form">
<div class="row">
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label for="name">Item Name</label>
<input type="text" name="name" id="name" class="form-control" value="${item.name || ''}" required>
</div>
</div>
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label for="quantity">Quantity</label>
<input type="number" name="quantity" id="quantity" class="form-control" min="0" step="1" value="${item.quantity || 0}" required>
</div>
</div>
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label for="price">Price</label>
<input type="number" name="price" id="price" step="0.01" min="0" class="form-control" value="${item.price || 0}" required>
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
<button type="submit" class="btn btn-submit me-2">Update</button>
<a href="#/inventory-list" class="btn btn-cancel">Cancel</a>
</div>
</div>
</form>
</div>
</div>
</div>
</div>`;

    renderLayout(app, 'inventory-edit', html);

    document.getElementById('edit-inventory-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById('name').value,
        quantity: document.getElementById('quantity').value,
        price: document.getElementById('price').value,
        supplier: document.getElementById('supplier').value
      };
      const done = setBusy(e.submitter || e.target.querySelector('[type="submit"]'), 'Saving changes...');
      try {
        await put('/inventory/' + id, data);
        Swal.fire('Updated!', 'Inventory item has been updated.', 'success')
          .then(() => navigateTo('#/inventory-list'));
      } catch (err) {
        done();
        Swal.fire('Error!', err.message || 'Failed to update.', 'error');
      }
    });
  } catch (err) {
    app.innerHTML = `<div class="page-wrapper"><div class="content"><p class="text-danger">Failed to load: ${err.message}</p></div></div>`;
  }
});
