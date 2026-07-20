import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initIdleTimeout, IDLE_LIMIT_MS } from '../lib/idleTimeout.js';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.useFakeTimers();
  window.location.hash = '#/dashboard';
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('idle timeout', () => {
  it('signs the user out after the idle limit elapses', async () => {
    localStorage.setItem('token', 'active-token');
    localStorage.setItem('username', 'someone');

    initIdleTimeout();
    vi.advanceTimersByTime(IDLE_LIMIT_MS);
    await vi.runOnlyPendingTimersAsync();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('username')).toBeNull();
    expect(window.location.hash).toBe('#/signin');
    expect(fetch).toHaveBeenCalledWith('/api/log-out', expect.objectContaining({ method: 'POST' }));
  });

  it('does not sign the user out before the idle limit', async () => {
    localStorage.setItem('token', 'active-token');

    initIdleTimeout();
    vi.advanceTimersByTime(IDLE_LIMIT_MS - 1000);

    expect(localStorage.getItem('token')).toBe('active-token');
    expect(window.location.hash).toBe('#/dashboard');
  });

  it('resets the countdown when the user is active', async () => {
    localStorage.setItem('token', 'active-token');

    initIdleTimeout();
    // Almost time out, then a real interaction resets the clock.
    vi.advanceTimersByTime(IDLE_LIMIT_MS - 1000);
    window.dispatchEvent(new Event('mousemove'));
    vi.advanceTimersByTime(IDLE_LIMIT_MS - 1000);

    // Total elapsed exceeds one limit, but never a full limit without activity.
    expect(localStorage.getItem('token')).toBe('active-token');

    // After a further full idle period, it finally signs out.
    vi.advanceTimersByTime(1000);
    await vi.runOnlyPendingTimersAsync();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('releases the session when the tab goes away', async () => {
    localStorage.setItem('token', 'active-token');
    navigator.sendBeacon = vi.fn();

    initIdleTimeout();
    window.dispatchEvent(new Event('pagehide'));

    expect(navigator.sendBeacon).toHaveBeenCalledWith('/api/session/release');
  });

  it('does not release anything on exit when signed out', async () => {
    navigator.sendBeacon = vi.fn();

    initIdleTimeout();
    window.dispatchEvent(new Event('pagehide'));

    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it('does nothing when no user is signed in', async () => {
    initIdleTimeout();
    vi.advanceTimersByTime(IDLE_LIMIT_MS * 2);
    await vi.runOnlyPendingTimersAsync();

    expect(fetch).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#/dashboard');
  });
});
