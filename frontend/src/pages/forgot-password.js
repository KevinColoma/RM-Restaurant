import { registerRoute, navigate } from '../router.js';
import { post } from '../lib/api.js';

registerRoute('/forgot-password', (app) => {
  app.innerHTML = `
<div class="main-wrapper">
<div class="account-content">
<div class="login-wrapper">
<div class="login-content">
<div class="login-userset">
<div class="login-logo">
  <img src="assets/img/logo.png" alt="img">
</div>
<div class="login-userheading">
  <h3>Forgot Password?</h3>
  <h4>Enter your email to reset your password</h4>
</div>
<div id="error-message" class="alert alert-danger d-none"></div>
<div id="success-message" class="alert alert-success d-none"></div>
<form id="forgot-form">
  <div class="form-login">
    <label>Email</label>
    <div class="form-addons">
      <input type="email" name="email" id="email" placeholder="Enter your registered email" required>
      <img src="assets/img/icons/mail.svg" alt="img">
    </div>
  </div>
  <div class="form-login">
    <button type="submit" class="btn btn-login" id="submit-button">Send Reset Link</button>
  </div>
</form>
<div class="signinform text-center">
  <h4><a href="#/signin" class="hover-a">Back to Sign In</a></h4>
</div>
</div>
</div>
<div class="login-img">
  <img src="assets/img/login.jpg" alt="img">
</div>
</div>
</div>
</div>
  `;

  app.querySelector('#forgot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = app.querySelector('#email').value.trim();
    const errorEl = app.querySelector('#error-message');
    const successEl = app.querySelector('#success-message');
    const btn = app.querySelector('#submit-button');

    errorEl.classList.add('d-none');
    successEl.classList.add('d-none');

    btn.disabled = true;
    btn.textContent = 'Sending...';

    const data = await post('/forgot-password', { email });
    if (data?.success) {
      successEl.textContent = 'Password reset link sent! Check your email.';
      successEl.classList.remove('d-none');
    } else {
      errorEl.textContent = data?.message || 'Email not found.';
      errorEl.classList.remove('d-none');
    }
    btn.disabled = false;
    btn.textContent = 'Send Reset Link';
  });
});
