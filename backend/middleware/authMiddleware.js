const jwtUtils = require('../jwt');
const Usuario = require('../models/Usuario');

const requireAuth = async (req, res, next) => {
    const token = req.cookies.jwt;

    try {
        const decoded = await jwtUtils.verifyToken(token);
        if (!decoded) {
            return res.redirect('/signin');
        }

        const usuario = await Usuario.findById(decoded.usuarioId).populate('personaId');
        if (!usuario) {
            return res.redirect('/signin');
        }

        // Soft single-session: a valid, unexpired token always authenticates.
        // "One session at a time" is surfaced only at login time (the SignIn
        // controller prompts to sign out the other device), but an already
        // active session is never torn down mid-use by a later login
        // elsewhere. This avoids kicking users out on navigation when the same
        // account is open in more than one place (e.g. dev + production, two
        // browsers, or a stale tab).

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
        res.status(401).send('Token is blacklisted');
    }
};

module.exports = { requireAuth };
