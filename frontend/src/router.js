import { isAuthenticated } from './lib/auth.js';

const routePermissions = {
  mesero: ['/pos', '/orders-list', '/profile', '/signin', '/signup', '/forgot-password'],
  cocinero: ['/pos', '/orders-list', '/menu-list', '/profile', '/signin', '/signup', '/forgot-password'],
  gerente: ['/dashboard', '/pos', '/menu-list', '/orders-list', '/inventory-list', '/profile', '/signin', '/signup', '/forgot-password']
};

const routeDefaults = {
  mesero: '/pos',
  cocinero: '/pos',
  gerente: '/dashboard'
};

const routes = {};

export function registerRoute(path, renderFn) {
  routes[path] = renderFn;
}

export function navigate(path) {
  window.location.hash = path;
}

export function initRouter() {
  function resolve() {
    const rol = localStorage.getItem('rol') || 'admin';
    const defaultRoute = routeDefaults[rol] || '/dashboard';
    const fallback = isAuthenticated() ? defaultRoute : '/signin';
    const hash = window.location.hash.slice(1) || fallback;
    const base = hash.split('?')[0];

    if (!isAuthenticated() && base !== '/signin' && base !== '/signup' && base !== '/forgot-password') {
      window.location.hash = '#/signin';
      return;
    }

    const allowed = routePermissions[rol] || null;
    if (allowed && !allowed.includes(base)) {
      window.location.hash = '#' + defaultRoute;
      return;
    }

    const app = document.getElementById('app');
    if (routes[base]) {
      routes[base](app);
    } else {
      const prefixRoute = Object.keys(routes).find(r => r.endsWith('/') && base.startsWith(r));
      if (prefixRoute) {
        routes[prefixRoute](app);
      } else {
        app.innerHTML = '<h2>404</h2><p>Page not found</p>';
      }
    }
  }

  window.addEventListener('hashchange', resolve);
  resolve();
}
