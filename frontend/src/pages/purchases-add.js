import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get, post } from '../lib/api.js';

registerRoute('/purchases-add', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';

  try {
    const [supplierRes, inventoryRes] = await Promise.all([
      get('/suppliers'),
      get('/inventory')
    ]);
    const suppliers = supplierRes?.success ? (supplierRes.suppliers || supplierRes.data || []) : [];
    const inventoryItems = inventoryRes?.success ? (inventoryRes.inventoryItems || inventoryRes.data || []) : [];

    const supplierOpts = suppliers.length
      ? suppliers.map(s => `<option value="${s._id}">${s.name}</option>`).join('')
      : '<option value="">No suppliers available</option>';

    const itemOpts = inventoryItems.length
      ? inventoryItems.map(i => `<option value="${i.name}">${i.name}</option>`).join('')
      : '<option value="">No inventory items</option>';

    const today = new Date().toISOString().split('T')[0];

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4>Add Purchase</h4>
<h6>Record a new purchase from supplier</h6>
</div>
</div>
<div class="card">
<div class="card-body">
<form id="add-purchase-form">
<div class="row">
<div class="col-lg-6 col-sm-12 col-12">
<div class="form-group">
<label>Supplier</label>
<select class="form-control" id="supplier" required>
<option value="">Choose Supplier</option>
${supplierOpts}
</select>
</div>
</div>
<div class="col-lg-6 col-sm-12 col-12">
<div class="form-group">
<label>Purchase Date</label>
<input type="date" id="purchaseDate" class="form-control" value="${today}">
</div>
</div>
<div class="col-lg-12 col-sm-12 col-12">
<div class="form-group">
<label>Notes</label>
<textarea id="notes" class="form-control" rows="2" placeholder="Optional notes"></textarea>
</div>
</div>
</div>
<div class="row mt-3">
<div class="col-lg-12">
<h5>Purchase Items</h5>
<hr>
<div id="items-container">
<div class="row mb-2 item-row">
<div class="col-lg-4">
<select class="form-control item-select" required>
<option value="">Select item</option>
${itemOpts}
</select>
</div>
<div class="col-lg-2">
<input type="number" class="form-control item-qty" placeholder="Qty" min="1" required>
</div>
<div class="col-lg-2">
<input type="number" step="0.01" class="form-control item-price" placeholder="Unit Price" min="0" required>
</div>
<div class="col-lg-2">
<input type="text" class="form-control item-total" placeholder="Total" readonly>
</div>
<div class="col-lg-2">
<button type="button" class="btn btn-danger remove-item">Remove</button>
</div>
</div>
</div>
<button type="button" class="btn btn-success mt-2" id="add-item-btn">+ Add Item</button>
</div>
</div>
<div class="row mt-3">
<div class="col-lg-4 offset-lg-8">
<div class="form-group">
<label>Total Amount</label>
<input type="text" id="totalAmount" class="form-control" readonly value="0.00">
</div>
</div>
</div>
<div class="col-lg-12 mt-3">
<button type="submit" class="btn btn-submit me-2">Submit Purchase</button>
<a href="#/purchases-list" class="btn btn-cancel">Cancel</a>
</div>
</form>
</div>
</div>
</div>
</div>`;

    renderLayout(app, 'purchases-add', html);

    function recalcTotal() {
      let total = 0;
      document.querySelectorAll('.item-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const itemTotal = qty * price;
        row.querySelector('.item-total').value = itemTotal.toFixed(2);
        total += itemTotal;
      });
      document.getElementById('totalAmount').value = total.toFixed(2);
    }

    function attachEvents(row) {
      row.querySelector('.item-qty').addEventListener('input', recalcTotal);
      row.querySelector('.item-price').addEventListener('input', recalcTotal);
      row.querySelector('.remove-item').addEventListener('click', function() {
        if (document.querySelectorAll('.item-row').length > 1) {
          row.remove();
          recalcTotal();
        } else {
          Swal.fire('Info', 'At least one item is required.', 'info');
        }
      });
    }

    document.querySelectorAll('.item-row').forEach(attachEvents);

    document.getElementById('add-item-btn').addEventListener('click', function() {
      const container = document.getElementById('items-container');
      const firstRow = container.querySelector('.item-row');
      const newRow = firstRow.cloneNode(true);
      newRow.querySelector('.item-select').value = '';
      newRow.querySelector('.item-qty').value = '';
      newRow.querySelector('.item-price').value = '';
      newRow.querySelector('.item-total').value = '';
      container.appendChild(newRow);
      attachEvents(newRow);
    });

    document.getElementById('add-purchase-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const supplier = document.getElementById('supplier').value;
      if (!supplier) {
        Swal.fire('Error!', 'Please select a supplier.', 'error');
        return;
      }

      const items = [];
      let valid = true;
      document.querySelectorAll('.item-row').forEach(row => {
        const itemName = row.querySelector('.item-select').value;
        const qty = parseInt(row.querySelector('.item-qty').value);
        const price = parseFloat(row.querySelector('.item-price').value);
        if (!itemName || !(qty > 0) || !(price > 0)) {
          valid = false;
          return;
        }
        items.push({ itemName, quantity: qty, unitPrice: price });
      });

      if (!valid || items.length === 0) {
        Swal.fire('Error!', 'Please fill all item fields correctly.', 'error');
        return;
      }

      const payload = {
        supplier,
        items,
        purchaseDate: document.getElementById('purchaseDate').value,
        notes: document.getElementById('notes').value
      };

      try {
        await post('/purchases', payload);
        Swal.fire('Success!', 'Purchase recorded successfully.', 'success')
          .then(() => window.location.hash = '#/purchases-list');
      } catch (err) {
        Swal.fire('Error!', err.message || 'Failed to record purchase.', 'error');
      }
    });
  } catch (err) {
    app.innerHTML = `<div class="page-wrapper"><div class="content"><p class="text-danger">Failed to load: ${err.message}</p></div></div>`;
  }
});
