// Automatic sign-out after a period of inactivity, so accounts are never left
// open indefinitely. Any real interaction (mouse, keyboard, touch, scroll or
// route change) resets the countdown; after IDLE_LIMIT_MS with no activity the
// session is closed on both the client and the server and the user is returned
// to the sign-in screen.

export const IDLE_LIMIT_MS = 10 * 60 * 1000; // 10 minutes

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

let timer = null;

async function expireSession() {
  const token = localStorage.getItem('token');
  if (!token) return; // already signed out

  // Close the server-side session too (clears the jwt cookie + activeSessionId).
  try {
    await fetch('/api/log-out', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      }
    });
  } catch (e) { /* best effort — still sign out locally */ }

  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('personaId');

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'info',
      title: 'Session expired',
      text: 'You were signed out after 10 minutes of inactivity.',
      timer: 4000,
      showConfirmButton: true
    });
  }

  window.location.hash = '#/signin';
}

function resetIdleTimer() {
  if (timer) clearTimeout(timer);
  // Only arm the countdown while signed in.
  if (!localStorage.getItem('token')) return;
  timer = setTimeout(expireSession, IDLE_LIMIT_MS);
}

export function initIdleTimeout() {
  ACTIVITY_EVENTS.forEach(evt =>
    window.addEventListener(evt, resetIdleTimer, { passive: true }));
  // Navigating between pages counts as activity and (re)arms the timer, which
  // also starts it right after a fresh login redirects to the dashboard.
  window.addEventListener('hashchange', resetIdleTimer);
  resetIdleTimer();
}
