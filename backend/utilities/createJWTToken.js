const jwt = require('jsonwebtoken');

const createJWTToken = (res, userId) => {
    const token = jwt.sign(
        { userId: userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    
    // Set cookie for cross-domain use
    res.cookie('token', token, {
        httpOnly: true,
        secure: true,           // Needed for HTTPS
        sameSite: 'none',       // Important for cross-domain
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    });
    
    return token;
};

module.exports = { createJWTToken };
