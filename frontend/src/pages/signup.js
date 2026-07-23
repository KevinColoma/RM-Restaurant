import { registerRoute, navigate } from '../router.js';
import { post } from '../lib/api.js';

registerRoute('/signup', (app) => {
  app.innerHTML = `
<div class="main-wrapper">
<div class="account-content">
<div class="login-wrapper">
<div class="login-content">
<div class="login-userset">
<div class="login-logo">
  <img src="assets/img/logo.png" alt="RMS">
</div>
<div class="login-userheading">
  <h3>Sign Up</h3>
  <h4>Create your account</h4>
</div>
<div id="error-message" class="alert alert-danger d-none"></div>
<div id="success-message" class="alert alert-success d-none"></div>
<form id="signup-form">
  <div class="form-login">
    <label for="email">Email</label>
    <div class="form-addons">
      <input type="email" name="email" id="email" placeholder="Enter your email" required>
      <img src="assets/img/icons/mail.svg" alt="">
    </div>
  </div>
  <div class="form-login">
    <label for="ownerName">Owner Name</label>
    <div class="form-addons">
      <input type="text" name="ownerName" id="ownerName" placeholder="Enter owner name" pattern="[A-Za-zÀ-ÿ ]+" title="Only letters are allowed" required>
      <img src="assets/img/icons/user.svg" alt="">
    </div>
  </div>
  <div class="form-login">
    <label for="restaurantName">Restaurant Name</label>
    <div class="form-addons">
      <input type="text" name="restaurantName" id="restaurantName" placeholder="Enter restaurant name" required>
      <img src="assets/img/icons/shop.svg" alt="">
    </div>
  </div>
  <div class="form-login">
    <label for="city">City</label>
    <div class="form-addons">
      <input type="text" name="city" id="city" placeholder="Enter city" pattern="[A-Za-zÀ-ÿ ]+" title="Only letters are allowed" required>
      <img src="assets/img/icons/city.svg" alt="">
    </div>
  </div>
  <div class="form-login">
    <label for="address">Address</label>
    <div class="form-addons">
      <input type="text" name="address" id="address" placeholder="Enter address" required>
      <img src="assets/img/icons/address.svg" alt="">
    </div>
  </div>
  <div class="form-login">
    <label for="mobile">Mobile</label>
    <div class="form-addons">
      <input type="tel" name="mobile" id="mobile" placeholder="Enter mobile number" pattern="[0-9+ -]+" title="Only numbers are allowed" required>
      <img src="assets/img/icons/phone.svg" alt="">
    </div>
  </div>
  <div class="form-login">
    <label for="password">Password</label>
    <div class="pass-group">
      <input type="password" name="password" id="password" class="pass-input" placeholder="Enter your password" required minlength="6" maxlength="18">
      <span class="fas toggle-password fa-eye-slash"></span>
    </div>
  </div>
  <div class="form-login">
    <button type="submit" class="btn btn-login" id="submit-button">Sign Up</button>
  </div>
</form>
<div class="signinform text-center">
  <h4>Already a user? <a href="#/signin" class="hover-a">Sign In</a></h4>
</div>
</div>
</div>
<div class="login-img">
  <img src="assets/img/login.jpg" alt="">
</div>
</div>
</div>
</div>
  `;

  app.querySelector('#signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = app.querySelector('#email').value.trim();
    const ownerName = app.querySelector('#ownerName').value.trim();
    const restaurantName = app.querySelector('#restaurantName').value.trim();
    const city = app.querySelector('#city').value.trim();
    const address = app.querySelector('#address').value.trim();
    const mobile = app.querySelector('#mobile').value.trim();
    const password = app.querySelector('#password').value;
    const errorEl = app.querySelector('#error-message');
    const successEl = app.querySelector('#success-message');
    const btn = app.querySelector('#submit-button');

    errorEl.classList.add('d-none');
    successEl.classList.add('d-none');

    btn.disabled = true;
    btn.textContent = 'Creating account...';

    const data = await post('/signup', { email, ownerName, restaurantName, city, address, mobile, password });
    if (data?.success) {
      successEl.textContent = 'Account created! Redirecting to sign in...';
      successEl.classList.remove('d-none');
      setTimeout(() => navigate('/signin'), 1500);
    } else {
      errorEl.textContent = data?.message || 'An error occurred.';
      errorEl.classList.remove('d-none');
    }
    btn.disabled = false;
    btn.textContent = 'Sign Up';
  });

  const toggleBtn = app.querySelector('.toggle-password');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const input = app.querySelector('.pass-input');
      input.type = input.type === 'password' ? 'text' : 'password';
      toggleBtn.classList.toggle('fa-eye-slash');
      toggleBtn.classList.toggle('fa-eye');
    });
  }
});
