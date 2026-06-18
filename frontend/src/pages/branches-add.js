import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { post } from '../lib/api.js';

registerRoute('/branches-add', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';

  const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4>Add Branch</h4>
<h6>Create new branch</h6>
</div>
</div>
<div class="card">
<div class="card-body">
<form id="add-branch-form">
<div class="row">
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label>Branch Name</label>
<input type="text" name="branch_name" id="branch_name" class="form-control" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label>City</label>
<input type="text" name="city" id="city" class="form-control" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label>Address</label>
<input type="text" name="address" id="address" class="form-control" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label>Email</label>
<input type="email" name="email" id="email" class="form-control" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label>Mobile</label>
<input type="text" name="mobile" id="mobile" class="form-control" required>
</div>
</div>
<div class="col-lg-12">
<button type="submit" class="btn btn-submit me-2">Submit</button>
<a href="#/branches-list" class="btn btn-cancel">Cancel</a>
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
      branch_name: document.getElementById('branch_name').value,
      city: document.getElementById('city').value,
      address: document.getElementById('address').value,
      email: document.getElementById('email').value,
      mobile: document.getElementById('mobile').value
    };
    try {
      await post('/branches', data);
      Swal.fire('Success!', 'Branch added successfully.', 'success')
        .then(() => window.location.hash = '#/branches-list');
    } catch (err) {
      Swal.fire('Error!', err.message || 'Failed to add branch.', 'error');
    }
  });
});
