import { registerRoute } from '../router.js';

registerRoute('/forgot-password', (app) => {
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
  <h3 data-i18n="forgot.title">Forgot Password?</h3>
  <h4 data-i18n="forgot.coming_soon">This feature will be available soon. Please contact the system administrator.</h4>
</div>
<div class="signinform text-center">
  <h4><a href="#/signin" class="hover-a" data-i18n="forgot.back_to_signin">Back to Sign In</a></h4>
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
});
