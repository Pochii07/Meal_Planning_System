const User = require("../models/user_model");
const bcrypt = require("bcryptjs");
const { createJWTToken } = require("../utilities/createJWTToken");
const { sendVerificationEmail, sendWelcomeEmail } = require("../resend/email");

const signup = async (req, res) => {
    const {name, email, password} = req.body;
    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required'})
        };
        const userAlreadyExists = await User.findOne({ email });
        if (userAlreadyExists) {
           return res.status(400).json({ message: 'User already exists'})
        };
        const hashPassword = await bcrypt.hash(password, 10)
        const verificationToken = createVerificationToken();
        const user = new User ({
            name,
            email,
            password: hashPassword,
            verificationToken: verificationToken,
            // token expires at 24 hours
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000 
        });

        await user.save();
        
        createJWTToken(res, user._id);

        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                ...user._doc,
                password: undefined
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        })
    } 
}

// verification token generator from yt
const createVerificationToken = () => Math.floor (100000 + Math.random() * 900000).toString();

const login = async (req, res) => {
    res.send('Login route');
}
const logout = async (req, res) => {
    res.send('Logout route');
}

const verifyEmail = async (req, res) => {
    const {code} = req.body

    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: {$gt: Date.now() }, // gt for greater than

        })
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid / Expired verification code'
            });
        }
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();
        
        await sendWelcomeEmail(user.email, user.name);

    } catch (error) {
        console.log("Error sending verification email");
        throw new Error("Error sending verification email");
    }
}

module.exports = {
    signup,
    createVerificationToken,
    login,
    logout,
    verifyEmail
};
