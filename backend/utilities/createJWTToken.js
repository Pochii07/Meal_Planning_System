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
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: expiresIn === "7d" ? 7 * 24 * 60 * 60 * 1000 : undefined
        });
    }
 
    return token;
};

module.exports = { createJWTToken };
