import { registerRoute, navigate } from '../router.js';
import { signin } from '../lib/auth.js';

registerRoute('/signin', (app) => {
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
  <h3>Sign In</h3>
  <h4 data-i18n="signin.tagline">Restaurant management, in one place: menu, orders, inventory, expenses and reports.</h4>
  <p class="text-muted mb-0" data-i18n="signin.sub">Sign in with the account your restaurant registered.</p>
</div>
<div id="error-message" class="alert alert-danger d-none"></div>
<form id="signin-form">
  <div class="form-login">
    <label for="email">Email</label>
    <div class="form-addons">
      <input type="email" name="email" id="email" placeholder="Enter your email address" autocomplete="username" required>
      <img src="assets/img/icons/mail.svg" alt="">
    </div>
  </div>
  <div class="form-login">
    <label for="password">Password</label>
    <div class="pass-group">
      <input type="password" name="password" id="password" class="pass-input" placeholder="Enter your password" autocomplete="current-password" required minlength="3">
      <span class="fas toggle-password fa-eye-slash"></span>
    </div>
  </div>
  <div class="form-login">
    <div class="alreadyuser">
      <h4><a href="#/forgot-password" class="hover-a">Forgot Password?</a></h4>
    </div>
  </div>
  <div class="form-login">
    <button type="submit" class="btn btn-login" id="submit-button">Sign In</button>
  </div>
</form>
<div class="signinform text-center">
  <h4>Don't have an account? <a href="#/" class="hover-a">Sign Up</a></h4>
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

  app.querySelector('#signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = app.querySelector('#email').value.trim();
    const password = app.querySelector('#password').value;
    const errorEl = app.querySelector('#error-message');
    const btn = app.querySelector('#submit-button');

    errorEl.classList.add('d-none');
    if (!email || !password) {
      errorEl.textContent = 'Please enter both email and password.';
      errorEl.classList.remove('d-none');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Signing in...';

    try {
      const data = await signin(email, password);

      if (data?.success) {
        window.location.hash = '#/dashboard';
        return;
      }

      errorEl.textContent = data?.message || 'Invalid credentials.';
      errorEl.classList.remove('d-none');
    } catch (err) {
      console.error('Sign in failed:', err);
      errorEl.textContent = 'Could not reach the server. Please check your connection and try again.';
      errorEl.classList.remove('d-none');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });

  // Toggle password visibility
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
