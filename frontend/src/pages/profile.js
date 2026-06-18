import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get, put, upload } from '../lib/api.js';

registerRoute('/profile', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';

  try {
    const res = await get('/profile');
    const persona = res?.persona || res;

    const avatarUrl = persona.avatar || '/uploads/avatar-' + (persona._id || '') + '.png';

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4>My Profile</h4>
<h6>Manage your restaurant profile</h6>
</div>
</div>
<div class="card">
<div class="card-body">
<div class="text-center mb-4">
<img src="${avatarUrl}" id="profile-avatar" class="rounded-circle" width="120" height="120" style="object-fit:cover;border:3px solid #ff9f43;" onerror="this.src='assets/img/profiles/avator1.jpg'">
<div class="mt-2">
<label class="btn btn-outline-primary btn-sm">
Change Photo
<input type="file" id="avatar-input" accept="image/*" style="display:none">
</label>
</div>
</div>
<form id="profile-form">
<div class="row">
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label>Owner Name</label>
<input type="text" name="ownerName" id="ownerName" class="form-control" value="${persona.ownerName || ''}" required>
</div>
</div>
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label>Restaurant Name</label>
<input type="text" name="restaurantName" id="restaurantName" class="form-control" value="${persona.restaurantName || ''}" required>
</div>
</div>
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label>City</label>
<input type="text" name="city" id="city" class="form-control" value="${persona.city || ''}" required>
</div>
</div>
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label>Address</label>
<input type="text" name="address" id="address" class="form-control" value="${persona.address || ''}" required>
</div>
</div>
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label>Mobile</label>
<input type="text" name="mobile" id="mobile" class="form-control" value="${persona.mobile || ''}" required>
</div>
</div>
<div class="col-lg-12">
<button type="submit" class="btn btn-submit me-2">Update Profile</button>
</div>
</div>
</form>
</div>
</div>
<div class="card mt-4">
<div class="card-body">
<h4 class="card-title">Change Password</h4>
<form id="password-form">
<div class="row">
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label>Current Password</label>
<input type="password" name="currentPassword" id="currentPassword" class="form-control" required>
</div>
</div>
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label>New Password</label>
<input type="password" name="newPassword" id="newPassword" class="form-control" minlength="6" required>
</div>
</div>
<div class="col-lg-4 col-sm-6 col-12">
<div class="form-group">
<label>Confirm New Password</label>
<input type="password" id="confirmPassword" class="form-control" minlength="6" required>
</div>
</div>
<div class="col-lg-12">
<button type="submit" class="btn btn-submit me-2">Change Password</button>
</div>
</div>
</form>
</div>
</div>
</div>
</div>`;

    renderLayout(app, 'profile', html);

    document.getElementById('avatar-input').addEventListener('change', async function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('avatar', file);
      try {
        const data = await upload('/profile/avatar', formData);
        if (data.success) {
          document.getElementById('profile-avatar').src = data.avatarUrl + '?t=' + Date.now();
          Swal.fire('Success!', 'Photo updated. Reloading...', 'success')
            .then(() => location.reload());
        } else {
          Swal.fire('Error!', data.error || 'Upload failed.', 'error');
        }
      } catch (err) {
        Swal.fire('Error!', err.message || 'Upload failed.', 'error');
      }
    });

    document.getElementById('profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        ownerName: document.getElementById('ownerName').value,
        restaurantName: document.getElementById('restaurantName').value,
        city: document.getElementById('city').value,
        address: document.getElementById('address').value,
        mobile: document.getElementById('mobile').value
      };
      try {
        const res = await put('/profile', data);
        if (res.success) {
          Swal.fire('Success!', 'Profile updated successfully.', 'success')
            .then(() => location.reload());
        } else {
          Swal.fire('Error!', res.error || 'Update failed.', 'error');
        }
      } catch (err) {
        Swal.fire('Error!', err.message || 'Update failed.', 'error');
      }
    });

    document.getElementById('password-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      if (newPassword !== confirmPassword) {
        Swal.fire('Error!', 'Passwords do not match.', 'error');
        return;
      }
      try {
        const res = await put('/profile/password', { currentPassword, newPassword });
        if (res.success) {
          Swal.fire('Success!', 'Password changed successfully.', 'success');
          document.getElementById('password-form').reset();
        } else {
          Swal.fire('Error!', res.error || 'Failed to change password.', 'error');
        }
      } catch (err) {
        Swal.fire('Error!', err.message || 'Failed to change password.', 'error');
      }
    });
  } catch (err) {
    app.innerHTML = `<div class="page-wrapper"><div class="content"><p class="text-danger">Failed to load: ${err.message}</p></div></div>`;
  }
});
