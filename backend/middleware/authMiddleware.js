const jwtUtils = require('../jwt');
const Usuario = require('../models/Usuario');
const { LAST_SEEN_THROTTLE_MS } = require('../config/session');

const requireAuth = async (req, res, next) => {
    const token = req.cookies.jwt ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    try {
        const decoded = await jwtUtils.verifyToken(token);
        if (!decoded) {
            if (req.path.startsWith('/api/')) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            return res.redirect('/signin');
        }

        const usuario = await Usuario.findById(decoded.usuarioId).populate('personaId');
        if (!usuario) {
            if (req.path.startsWith('/api/')) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }
            return res.redirect('/signin');
        }

        // Soft single-session: a valid, unexpired token always authenticates.
        // "One session at a time" is surfaced only at login time (the SignIn
        // controller prompts to sign out the other device), but an already
        // active session is never torn down mid-use by a later login
        // elsewhere. This avoids kicking users out on navigation when the same
        // account is open in more than one place (e.g. dev + production, two
        // browsers, or a stale tab).

        // Mark the session as alive. Throttled so an active user costs at most
        // one write per minute; this timestamp is what lets the login check
        // tell a live session from one whose browser simply vanished.
        // Strictly best effort: this bookkeeping must never be able to fail the
        // request and sign a legitimate user out, so it is fully isolated.
        try {
            if (decoded.sessionId) {
                if (!usuario.activeSessionId) {
                    // The slot is free - typically because this tab's pagehide
                    // beacon released it and the page then came back from a
                    // refresh. Re-claim it so a reload keeps its session rather
                    // than leaving the account looking signed out.
                    usuario.activeSessionId = decoded.sessionId;
                    usuario.lastSeenAt = new Date();
                    await usuario.save();
                } else if (usuario.activeSessionId === decoded.sessionId) {
                    const last = usuario.lastSeenAt ? usuario.lastSeenAt.getTime() : 0;
                    if (Date.now() - last > LAST_SEEN_THROTTLE_MS) {
                        usuario.lastSeenAt = new Date();
                        await usuario.save();
                    }
                }
            }
        } catch (e) { /* activity tracking is not worth failing auth over */ }

        req.usuario = usuario;
        req.personaId = usuario.personaId._id;
        req.restaurant = { restaurantId: usuario.personaId._id };
        res.locals.personaId = usuario.personaId._id;
        res.locals.restaurantId = usuario.personaId._id;
        res.locals.ownerName = usuario.personaId.ownerName || 'Owner';
        res.locals.restaurantName = usuario.personaId.restaurantName || '';
        res.locals.avatar = usuario.personaId.avatar || '';

        next();
    } catch (error) {
        console.error(error);
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
        res.status(401).send('Invalid or expired token');
    }
};

module.exports = { requireAuth };
