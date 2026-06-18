import { initRouter, registerRoute } from './router.js';
import { isAuthenticated } from './lib/auth.js';

// Pages (lazy loaded)
import './pages/signin.js';
import './pages/signup.js';
import './pages/dashboard.js';
import './pages/pos.js';
import './pages/menu-list.js';
import './pages/menu-add.js';
import './pages/menu-edit.js';
import './pages/orders-list.js';
import './pages/inventory-list.js';
import './pages/inventory-add.js';
import './pages/inventory-edit.js';
import './pages/suppliers-list.js';
import './pages/expenses-list.js';
import './pages/expenses-add.js';
import './pages/expenses-edit.js';
import './pages/customers-list.js';
import './pages/purchases-list.js';
import './pages/purchases-add.js';
import './pages/branches-list.js';
import './pages/branches-add.js';
import './pages/profile.js';
import './pages/settings.js';
import './pages/audit-log.js';
import './pages/reports-sales.js';
import './pages/reports-dates.js';
import './pages/forgot-password.js';

document.addEventListener('DOMContentLoaded', () => {
  if (isAuthenticated() && (window.location.hash === '' || window.location.hash === '#/signin')) {
    window.location.hash = '#/dashboard';
  }
  initRouter();
});
