import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('main.js', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
    window.location.hash = '';
  });

  it('registers DOMContentLoaded listener on import', async () => {
    const spy = vi.spyOn(document, 'addEventListener');
    await import('../main.js');
    expect(spy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
    spy.mockRestore();
  });

  it('redirects authenticated user to dashboard on DOMContentLoaded', async () => {
    localStorage.setItem('token', 'valid-token');
    const addListenerSpy = vi.spyOn(document, 'addEventListener');

    await import('../main.js');

    const handler = addListenerSpy.mock.calls.find(
      ([event]) => event === 'DOMContentLoaded'
    )?.[1];

    if (handler) {
      handler();
      expect(window.location.hash).toBe('#/dashboard');
    }

    addListenerSpy.mockRestore();
  });

  it('stays on signin when not authenticated', async () => {
    window.location.hash = '#/signin';
    const addListenerSpy = vi.spyOn(document, 'addEventListener');

    await import('../main.js');

    const handler = addListenerSpy.mock.calls.find(
      ([event]) => event === 'DOMContentLoaded'
    )?.[1];

    if (handler) {
      handler();
      expect(window.location.hash).toBe('#/signin');
    }

    addListenerSpy.mockRestore();
  });
});
