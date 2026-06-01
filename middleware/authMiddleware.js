const jwtUtils = require('../jwt');
const Restaurant = require('../models/restaurant');

const requireAuth = async (req, res, next) => {
    const token = req.cookies.jwt;

    try {
        const decoded = await jwtUtils.verifyToken(token); 
        if (!decoded) {
            res.redirect('/signin');
        } else {
            req.restaurant = { restaurantId: decoded.restaurantId };
            res.locals.restaurantId = decoded.restaurantId;

            try {
                const rest = await Restaurant.findById(decoded.restaurantId);
                if (rest) {
                    res.locals.ownerName = rest.ownerName || 'Owner';
                    res.locals.restaurantName = rest.restaurantName || '';
                    res.locals.avatar = rest.avatar || '';
                }
            } catch (_) {
                res.locals.ownerName = 'Owner';
                res.locals.restaurantName = '';
                res.locals.avatar = '';
            }

            next();
        }
    } catch (error) {
        console.error(error);
        res.status(401).send('Token is blacklisted');
    }
};

module.exports = { requireAuth };
