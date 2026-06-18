import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('router', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
    window.location.hash = '';
  });

  it('navigate sets window.location.hash', async () => {
    const { navigate } = await import('../router.js');
    navigate('/test');
    expect(window.location.hash).toBe('#/test');
  });

  it('initRouter renders signin as default when not authenticated', async () => {
    const { initRouter } = await import('../router.js');
    initRouter();
    expect(window.location.hash).toBe('');
  });

  it('initRouter redirects to signin when accessing protected route unauthenticated', async () => {
    const { initRouter } = await import('../router.js');
    window.location.hash = '#/dashboard';
    initRouter();
    expect(window.location.hash).toBe('#/signin');
  });

  it('initRouter renders registered protected route when authenticated', async () => {
    localStorage.setItem('token', 'valid');
    const { initRouter, registerRoute } = await import('../router.js');
    const renderFn = vi.fn();
    registerRoute('/dashboard', renderFn);
    window.location.hash = '#/dashboard';
    initRouter();
    expect(renderFn).toHaveBeenCalledOnce();
    expect(renderFn).toHaveBeenCalledWith(document.getElementById('app'));
  });

  it('initRouter shows 404 for unknown route when authenticated', async () => {
    localStorage.setItem('token', 'valid');
    const { initRouter } = await import('../router.js');
    window.location.hash = '#/nonexistent';
    initRouter();
    expect(document.getElementById('app').innerHTML).toContain('404');
  });

  it('initRouter resolves prefix routes when authenticated', async () => {
    localStorage.setItem('token', 'valid');
    const { initRouter, registerRoute } = await import('../router.js');
    const renderFn = vi.fn();
    registerRoute('/prefix/', renderFn);
    window.location.hash = '#/prefix/123';
    initRouter();
    expect(renderFn).toHaveBeenCalledOnce();
  });

  it('initRouter allows signup without auth', async () => {
    const { initRouter, registerRoute } = await import('../router.js');
    const renderFn = vi.fn();
    registerRoute('/signup', renderFn);
    window.location.hash = '#/signup';
    initRouter();
    expect(renderFn).toHaveBeenCalledOnce();
  });

  it('registerRoute stores route handler', async () => {
    const { registerRoute } = await import('../router.js');
    const fn = () => {};
    expect(() => registerRoute('/test', fn)).not.toThrow();
  });
});
