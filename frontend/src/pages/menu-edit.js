import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get, put } from '../lib/api.js';
import { navigateTo } from '../lib/listPage.js';
import { setBusy } from '../lib/formFeedback.js';

registerRoute('/menu-edit/', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';

  const hash = window.location.hash;
  const id = hash.replace('#/menu-edit/', '');
  if (!id) {
    app.innerHTML = '<div class="page-wrapper"><div class="content"><p class="text-danger">Invalid menu item ID.</p></div></div>';
    return;
  }

  try {
    const res = await get('/menu');
    const menus = res?.success ? (res.menus || res.data || []) : [];
    const menu = menus.find(m => m._id === id);
    if (!menu) {
      app.innerHTML = '<div class="page-wrapper"><div class="content"><p class="text-danger">Menu item not found.</p></div></div>';
      return;
    }

    const available = menu.availability !== undefined ? menu.availability : true;
    const catOptions = ['Veg', 'Non-Veg'].map(c =>
      `<option value="${c}"${menu.category === c ? ' selected' : ''}>${c}</option>`
    ).join('');
    const subOptions = ['Starter', 'Main Course', 'Beverage', 'Soup', 'Salad', 'Roti', 'Rice', 'Dessert', 'Juice', 'Snack', 'Side Dish'].map(s =>
      `<option value="${s}"${menu.subCategory === s ? ' selected' : ''}>${s}</option>`
    ).join('');

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="menu.edit_title">Edit Item</h4>
<h6 data-i18n="menu.edit_sub">Update item details</h6>
</div>
</div>
<div class="card">
<div class="card-body">
<form id="edit-item-form">
<div class="row">
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="item" data-i18n="form.item_name">Item Name</label>
<input type="text" name="item" id="item" class="form-control" value="${menu.item || ''}" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="category" data-i18n="table.category">Category</label>
<select class="form-control" name="category" id="category" required>${catOptions}</select>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="subCategory" data-i18n="table.subcategory">Sub Category</label>
<select class="form-control" name="subCategory" id="subCategory" required>${subOptions}</select>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="price" data-i18n="form.price">Price</label>
<input type="number" name="price" id="price" class="form-control" step="0.01" min="0" value="${menu.price || ''}" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="menu.available">
<input type="checkbox" name="available" id="available"${available ? ' checked' : ''}>
Available
</label>
</div>
</div>
<div class="col-lg-12">
<button type="submit" class="btn btn-submit me-2" data-i18n="common.update">Update</button>
<a href="#/menu-list" class="btn btn-cancel" data-i18n="form.cancel">Cancel</a>
</div>
</div>
</form>
</div>
</div>
</div>
</div>`;

    renderLayout(app, 'menu-edit', html);

    document.getElementById('edit-item-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        item: document.getElementById('item').value,
        category: document.getElementById('category').value,
        subCategory: document.getElementById('subCategory').value,
        price: document.getElementById('price').value,
        available: document.getElementById('available').checked
      };
      const done = setBusy(e.submitter || e.target.querySelector('[type="submit"]'), window.t('menu.updating'));
      try {
        await put('/menu/' + id, data);
        Swal.fire(window.t('common.success'), window.t('menu.updated'), 'success')
          .then(() => navigateTo('#/menu-list'));
      } catch (err) {
        done();
        Swal.fire(window.t('common.error'), err.message || window.t('menu.failed_update'), 'error');
      }
    });
  } catch (err) {
    app.innerHTML = `<div class="page-wrapper"><div class="content"><p class="text-danger">Failed to load: ${err.message}</p></div></div>`;
  }
});
