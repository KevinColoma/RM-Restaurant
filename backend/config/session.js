// Single-session tuning, kept in one place so the login check and the
// activity tracker can never drift apart.

// How long an active session may go without an authenticated request before
// it is treated as dead and its account can be signed into again. Matches the
// frontend's inactivity auto sign-out (lib/idleTimeout.js) so both agree on
// when a session ends.
//
// This is what keeps "block a second login" from ever locking an account out
// permanently: a browser that closes, crashes or loses power can never tell
// the server it is gone, so the session has to expire on its own.
const SESSION_IDLE_MS = 10 * 60 * 1000; // 10 minutes

// Minimum gap between lastSeenAt writes, so an active user costs at most one
// extra update per minute instead of one per request.
const LAST_SEEN_THROTTLE_MS = 60 * 1000; // 1 minute

module.exports = { SESSION_IDLE_MS, LAST_SEEN_THROTTLE_MS };
