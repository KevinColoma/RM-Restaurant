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

        // Single-session enforcement: if this token's session no longer
        // matches the account's active session, it means the user logged in
        // from another device and this session was invalidated.
        if (!decoded.sessionId || usuario.activeSessionId !== decoded.sessionId) {
            res.clearCookie('jwt');
            return res.status(401).json({ message: 'Session expired: this account was signed in from another device.' });
        }

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
