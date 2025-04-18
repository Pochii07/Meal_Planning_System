const jwt = require("jsonwebtoken");

const createJWTToken = (res, userId, options = {}) => {
    const { expiresIn = "7d", isVerificationToken = false } = options;

    const token = jwt.sign(
        { 
            userId,
            isVerificationToken
        }, 
        process.env.JWT_SECRET, 
        { expiresIn }
    );

    // set cookie for security purposes || regular session tokens
    if (!isVerificationToken){
        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Required for SameSite=None
            sameSite: 'None', // Allow cross-site cookie
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
    }
 
    return token;
};

module.exports = { createJWTToken };
