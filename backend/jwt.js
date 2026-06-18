require('dotenv').config();
const jwt = require('jsonwebtoken');

// const BlacklistedToken = require('./models/BlacklistedToken');

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const verifyToken = async (token) => {
    try {
       
        // const blacklisted = await BlacklistedToken.findOne({ token });
        // if (blacklisted) {
            
        //     return null;
        // }

        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
};


module.exports = { generateToken, verifyToken };
