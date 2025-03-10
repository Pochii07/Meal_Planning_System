const User = require("../models/user_model");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { createJWTToken } = require("../utilities/createJWTToken");
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendPasswordResetSuccessEmail } = require("../resend/email");

const signup = async (req, res) => {
    const generateCustomIdTemplate = () => {
        const randomId = Math.floor(Math.random() * 1000).toString().padStart(4, '0');
        return `MPS000${randomId}`;
    };

    const generateUniqueId = async () => {
        let newId = generateCustomIdTemplate();
        let isUnique = await User.exists({ _id: newId });

        while (isUnique) {
            newId = generateCustomId();
            isUnique = await User.exists({ _id: newId });
        }
        return newId;
    };

    const newId = await generateUniqueId();

    // creating document / user login entry
    const {firstName, lastName, birthDate, sex, email, password} = req.body;
    
    try {
        if (!firstName || !lastName || !birthDate || !sex || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }       
        const userAlreadyExists = await User.findOne({ email });
        if (userAlreadyExists) {
           return res.status(400).json({ message: 'User already exists'})
        };
        const hashPassword = await bcrypt.hash(password, 10)
        const verificationToken = createVerificationToken();
        const user = new User({
            _id: newId,
            firstName,
            lastName,
            birthDate,
            sex,
            email,
            password: hashPassword,
            verificationToken,
            // Token expires in 24 hours
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
                password: undefined,
                verificationTokenExpiresAt: undefined,
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
    const {email, password} = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = createJWTToken(res, user._id);

        res.status(200).json({
            success: true,
            user: {
                ...user._doc,
                password: undefined,
                token // Include token in response
            }
        });
    } catch (error) {
        console.log("Error logging in");
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}
const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
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
        } else {
        }
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();
        
        await sendWelcomeEmail(user.email);
        return res.status(200).json({
            success: true,
        })
    } catch (error) {
        console.log("Error sending verification email");
        throw new Error("Error sending verification email");
    }
}

const forgotPassword = async (req, res) => {
    const {email} = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        const resetPasswordToken = crypto.randomBytes(32).toString("hex");
        const resetPasswordTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000 // token expires at 1 hour

        user.resetPasswordToken = resetPasswordToken;
        user.resetPasswordTokenExpiresAt = resetPasswordTokenExpiresAt;

        await user.save();
        await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset_password/${resetPasswordToken}`);
        res.status(200).json({
            success: true,
            message: 'Password reset email sent successfully'
        });
    } catch (error) {
        console.log("Error sending password reset email");
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

const resetPassword = async (req, res) => {
    try {
        const {token} = req.params;
        const {password} = req.body;
        const user = await User.findOne({ 
            resetPasswordToken: token,
            resetPasswordTokenExpiresAt: {$gt: Date.now()},
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid / Expired token'
            });
        }
        const hashPassword = await bcrypt.hash(password, 10)
        user.password = hashPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpiresAt = undefined;
        await user.save();

        await sendPasswordResetSuccessEmail(user.email);
        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error("Error resetting password: ", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user: {
                ...user._doc,
                password: undefined
            }
        });

    } catch (error) {
        console.log("Error checking auth", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = { signup, createVerificationToken, login, logout, verifyEmail, forgotPassword, resetPassword, checkAuth };
