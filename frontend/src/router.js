import { isAuthenticated } from './lib/auth.js';

const routes = {};

export function registerRoute(path, renderFn) {
  routes[path] = renderFn;
}

export function navigate(path) {
  window.location.hash = path;
}

export function initRouter() {
  function resolve() {
    // A stray anchor (href="#") can wipe the hash. Falling back to /signin then
    // strands an authenticated user on the login screen, so send them to the
    // dashboard instead and only default to /signin when actually signed out.
    const fallback = isAuthenticated() ? '/dashboard' : '/signin';
    const hash = window.location.hash.slice(1) || fallback;
    const base = hash.split('?')[0];

    if (!isAuthenticated() && base !== '/signin' && base !== '/signup' && base !== '/forgot-password') {
      window.location.hash = '#/signin';
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
