import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { post } from '../lib/api.js';
import { navigateTo } from '../lib/listPage.js';
import { setBusy } from '../lib/formFeedback.js';

registerRoute('/branches-add', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';

  const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="branch.add_title">Add Branch</h4>
<h6 data-i18n="branch.add_sub">Create new branch</h6>
</div>
</div>
<div class="card">
<div class="card-body">
<form id="add-branch-form">
<div class="row">
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="Parent_Rest" data-i18n="branch.choose_parent">Parent Restaurant</label>
<input type="text" name="Parent_Rest" id="Parent_Rest" class="form-control" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="ownerName" data-i18n="form.owner_name">Owner Name</label>
<input type="text" name="ownerName" id="ownerName" class="form-control" pattern="[A-Za-zÀ-ÿ ]+" title="Only letters are allowed" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="restaurantName" data-i18n="form.restaurant_name">Restaurant Name</label>
<input type="text" name="restaurantName" id="restaurantName" class="form-control" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="city" data-i18n="form.city">City</label>
<input type="text" name="city" id="city" class="form-control" pattern="[A-Za-zÀ-ÿ ]+" title="Only letters are allowed" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="address" data-i18n="form.address">Address</label>
<input type="text" name="address" id="address" class="form-control" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="email" data-i18n="form.email">Email</label>
<input type="email" name="email" id="email" class="form-control" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="mobile" data-i18n="form.mobile">Mobile</label>
<input type="tel" name="mobile" id="mobile" class="form-control" pattern="[0-9+ -]+" title="Only numbers are allowed" required>
</div>
</div>
<div class="col-lg-12">
<button type="submit" class="btn btn-submit me-2" data-i18n="form.submit">Submit</button>
<a href="#/branches-list" class="btn btn-cancel" data-i18n="form.cancel">Cancel</a>
</div>
</div>
</form>
</div>
</div>
</div>
</div>`;

  renderLayout(app, 'branches-add', html);

  document.getElementById('add-branch-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      restaurantName: document.getElementById('restaurantName').value,
      Parent_Rest: document.getElementById('Parent_Rest').value,
      ownerName: document.getElementById('ownerName').value,
      city: document.getElementById('city').value,
      address: document.getElementById('address').value,
      email: document.getElementById('email').value,
      mobile: document.getElementById('mobile').value
    };
    const done = setBusy(e.submitter || e.target.querySelector('[type="submit"]'), window.t('branch.saving'));
    try {
      await post('/branches', data);
      Swal.fire(window.t('common.success'), window.t('branch.added'), 'success')
        .then(() => navigateTo('#/branches-list'));
    } catch (err) {
      done();
      Swal.fire(window.t('common.error'), err.message || window.t('branch.failed_add'), 'error');
    }
  });
});
