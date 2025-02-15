// import jwt from 'jsonwebtoken';

// export const createJWTToken = (res, userID) => {
//     const token = jwt.sign({ userID }, process.env.JWT_SECRET, {
//         expiresIn: "7 days"
//     })

//     // for advanced security purposes
//     res.cookie('token', token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'strict',          
//         maxAge: 7 * 24 * 60 * 60 * 1000 
//     })

//     return token;
// }
const jwt = require("jsonwebtoken");

const createJWTToken = (res, userID) => {
    const token = jwt.sign({ userID }, process.env.JWT_SECRET, {
        expiresIn: "7 days"
    });

    // Set cookie for security purposes
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return token;
};

module.exports = { createJWTToken };
