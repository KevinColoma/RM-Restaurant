import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { post } from '../lib/api.js';
import { navigateTo } from '../lib/listPage.js';
import { setBusy } from '../lib/formFeedback.js';

registerRoute('/menu-add', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';

  const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="menu.add_title">Item Add</h4>
<h6 data-i18n="menu.add_sub">Create new Item</h6>
</div>
</div>
<div class="card">
<div class="card-body">
<form id="add-item-form">
<div class="row">
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="item" data-i18n="form.item_name">Item Name</label>
<input type="text" name="item" id="item" class="form-control" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="category" data-i18n="table.category">Category</label>
<select class="form-control" name="category" id="category" required>
<option value="" data-i18n-placeholder="menu.choose_category">Choose Category</option>
<option value="Veg">Veg</option>
<option value="Non-Veg">Non-Veg</option>
</select>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="subCategory" data-i18n="table.subcategory">Sub Category</label>
<select class="form-control" name="subCategory" id="subCategory" required>
<option value="" data-i18n-placeholder="menu.choose_subcategory">Choose Sub Category</option>
<option value="Starter">Starter</option>
<option value="Main Course">Main Course</option>
<option value="Beverage">Beverage</option>
<option value="Soup">Soup</option>
<option value="Salad">Salad</option>
<option value="Roti">Roti</option>
<option value="Rice">Rice</option>
<option value="Dessert">Dessert</option>
<option value="Juice">Juice</option>
<option value="Snack">Snack</option>
<option value="Side Dish">Side Dish</option>
</select>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="price" data-i18n="form.price">Price</label>
<input type="number" name="price" id="price" class="form-control" step="0.01" min="0" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label data-i18n="menu.available">
<input type="checkbox" name="available" id="available" checked>
Available
</label>
</div>
</div>
<div class="col-lg-12">
<button type="submit" class="btn btn-submit me-2" data-i18n="form.submit">Submit</button>
<a href="#/menu-list" class="btn btn-cancel" data-i18n="form.cancel">Cancel</a>
</div>
</div>
</form>
</div>
</div>
</div>
</div>`;

  renderLayout(app, 'menu-add', html);

  document.getElementById('add-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      item: document.getElementById('item').value,
      category: document.getElementById('category').value,
      subCategory: document.getElementById('subCategory').value,
      price: document.getElementById('price').value,
      available: document.getElementById('available').checked
    };
    const done = setBusy(e.submitter || e.target.querySelector('[type="submit"]'), window.t('menu.saving'));
    try {
      await post('/menu', data);
      Swal.fire(window.t('common.success'), window.t('menu.added'), 'success')
        .then(() => navigateTo('#/menu-list'));
    } catch (err) {
      done();
      Swal.fire(window.t('common.error'), err.message || window.t('menu.failed_add'), 'error');
    }
  });
});
