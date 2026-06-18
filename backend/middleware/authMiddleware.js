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
