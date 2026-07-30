import { registerRoute, navigate } from '../router.js';
import { signin } from '../lib/auth.js';

registerRoute('/signin', (app) => {
  const lang = localStorage.getItem('rms-lang') || 'es';
  const flag = lang === 'es' ? 'es' : 'us';
  app.innerHTML = `
<div class="main-wrapper">
<div class="account-content">
<div class="login-wrapper">
<div class="login-content">
<div class="login-userset">
<div class="login-logo">
  <img src="assets/img/logo.png" alt="RMS">
</div>
<div class="dropdown" style="position:fixed;top:15px;right:15px;z-index:999">
  <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="javascript:void(0);" role="button" style="padding:0;background:#fff;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.15)">
    <img src="assets/img/flags/${flag}.png" alt="" height="28" id="login-lang-flag" style="display:block;margin:4px 8px">
  </a>
  <div class="dropdown-menu dropdown-menu-right">
    <a href="javascript:void(0);" class="dropdown-item" data-lang="en">
      <img src="assets/img/flags/us.png" alt="" height="16"> <span data-i18n="lang.en">English</span>
    </a>
    <a href="javascript:void(0);" class="dropdown-item" data-lang="es">
      <img src="assets/img/flags/es.png" alt="" height="16"> <span data-i18n="lang.es">Spanish</span>
    </a>
  </div>
</div>
<div class="login-userheading">
  <h3 data-i18n="signin.title">Sign In</h3>
  <h4 data-i18n="signin.tagline">Restaurant management, in one place: menu, orders, inventory, expenses and reports.</h4>
  <p class="text-muted mb-0" data-i18n="signin.sub">Sign in with the account your restaurant registered.</p>
</div>
<div id="error-message" class="alert alert-danger d-none"></div>
<form id="signin-form">
  <div class="form-login">
    <label for="email" data-i18n="form.email">Email</label>
    <div class="form-addons">
      <input type="email" name="email" id="email" placeholder="Enter your email address" autocomplete="username" required data-i18n-placeholder="signin.email_placeholder">
      <img src="assets/img/icons/mail.svg" alt="">
    </div>
  </div>
  <div class="form-login">
    <label for="password" data-i18n="form.password">Password</label>
    <div class="pass-group">
      <input type="password" name="password" id="password" class="pass-input" placeholder="Enter your password" autocomplete="current-password" required minlength="3" data-i18n-placeholder="signin.password_placeholder">
      <span class="fas toggle-password fa-eye-slash"></span>
    </div>
  </div>
  <div class="form-login">
    <div class="alreadyuser">
      <h4><a href="#/forgot-password" class="hover-a" data-i18n="signin.forgot">Forgot Password?</a></h4>
    </div>
  </div>
  <div class="form-login">
    <button type="submit" class="btn btn-login" id="submit-button" data-i18n="signin.submit">Sign In</button>
  </div>
</form>
<div class="signinform text-center">
  <h4><span data-i18n="signin.no_account">Don't have an account?</span> <a href="#/signup" class="hover-a" data-i18n="signup.submit">Sign Up</a></h4>
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

  if (typeof applyTranslations === 'function') applyTranslations();

  app.querySelector('#signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = app.querySelector('#email').value.trim();
    const password = app.querySelector('#password').value;
    const errorEl = app.querySelector('#error-message');
    const btn = app.querySelector('#submit-button');

    errorEl.classList.add('d-none');
    if (!email || !password) {
      errorEl.textContent = window.t('signin.empty_fields');
      errorEl.classList.remove('d-none');
      return;
    }

    btn.disabled = true;
    btn.textContent = window.t('signin.signing_in');

    try {
      const data = await signin(email, password);

      if (data?.success) {
        const rol = localStorage.getItem('rol') || 'admin';
        const roleRedirects = { mesero: '#/pos', cocinero: '#/pos', gerente: '#/dashboard' };
        window.location.hash = roleRedirects[rol] || '#/dashboard';
        return;
      }

      errorEl.textContent = data?.message || window.t('signin.invalid_credentials');
      errorEl.classList.remove('d-none');
    } catch (err) {
      console.error('Sign in failed:', err);
      errorEl.textContent = window.t('signin.server_error');
      errorEl.classList.remove('d-none');
    } finally {
      btn.disabled = false;
      btn.textContent = window.t('signin.submit');
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

  // Language switcher
  app.querySelectorAll('[data-lang]').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const lang = this.getAttribute('data-lang');
      if (typeof setLanguage === 'function') {
        setLanguage(lang);
        const loginFlag = app.querySelector('#login-lang-flag');
        if (loginFlag) {
          const flags = { en: 'us', es: 'es' };
          loginFlag.src = 'assets/img/flags/' + (flags[lang] || 'us') + '.png';
        }
      }
    });
  });
});
