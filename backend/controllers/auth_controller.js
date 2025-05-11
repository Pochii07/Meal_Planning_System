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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const {firstName, lastName, birthDate, sex, email, password, role} = req.body;
    
    try {
        if (!firstName || !lastName || !birthDate || !sex || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        } 

        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        
        const birthDateObj = new Date(birthDate);
        const today = new Date();
        
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const monthDiff = today.getMonth() - birthDateObj.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
            age--;
        }
        if (age < 20) {
            return res.status(400).json({ message: 'You must be at least 20 years old to sign up.' });
        } else if (age > 66){
            return res.status(400).json({ message: 'You must be at most 65 years old to sign up.' });
        }

        const userAlreadyExists = await User.findOne({ email });
        if (userAlreadyExists) {
           return res.status(400).json({ message: 'User already exists'})
        };

        // Only allow nutritionist signup
        if (role && role !== 'nutritionist') {
            return res.status(400).json({ message: 'Invalid role specification' });
        }

        const hashPassword = await bcrypt.hash(password, 10)
        const verificationToken = createVerificationToken();
        const userData = {
            _id: newId,
            firstName,
            lastName,
            birthDate,
            sex,
            email,
            password: hashPassword,
            verificationToken,
            // Token expires in 24 hours
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
            role: 'nutritionist'
        };
        
        const user = new User(userData);
        
        await user.save();
        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            success: true,
            message: "User created successfully",
            verificationData: {
                email: user.email,
                expiresAt: user.verificationTokenExpiresAt,
                tempUserId: user._id,
                token: user.verificationToken,
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
    const { email, password } = req.body;
  
    try {
        const user = await User.findOne({ email });
        if (!user || !user.password) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        let isPasswordValid;
        try {
            isPasswordValid = await bcrypt.compare(password, user.password);
        } catch (bcryptError) {
            console.error("Bcrypt error:", bcryptError.message);
            return res.status(400).json({
                success: false,
                message: 'Invalid password format', 
            });
        }

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect password', // Wrong password
            });
        }

        // Update login to only accept nutritionists/admins
        if (user.role !== 'nutritionist' && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // user exists but isn't verified
        if (!user.isVerified) {
            return res.status(200).json({
                email: user.email,
                expiresAt: user.verificationTokenExpiresAt,
                verificationToken: user.verificationToken,
                message: 'Account requires verification',
                requiresVerification: true,
                success: true,
            });
        }
        // session token
        const token = createJWTToken(res, user._id);

        res.status(200).json({
            success: true,
            user: {
                ...user._doc,
                password: undefined,
                token
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(400).json({
            success: false,
            message: 'An error occurred during login' // Avoid exposing error.message
        });
    }
  };
  
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
            verificationTokenExpiresAt: {$gt: Date.now() },
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
        
        // await sendWelcomeEmail(user.email);
        return res.status(200).json({
            success: true,
        })
    } catch (error) {
        console.log("Error sending verification email ", error);
        throw new Error("Error sending verification email");
    }
}
const forgotPassword = async (req, res) => {
    const {email} = req.body;

    try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        const user = await User.findOne({ email });
        if (user) {
            const resetPasswordToken = crypto.randomBytes(32).toString("hex");
            const resetPasswordTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000 // token expires at 1 hour
    
            user.resetPasswordToken = resetPasswordToken;
            user.resetPasswordTokenExpiresAt = resetPasswordTokenExpiresAt;
    
            await user.save();
            await sendPasswordResetEmail(user.email, (user.firstName).toUpperCase(), `${process.env.CLIENT_URL}/reset_password/${resetPasswordToken}`); 
        }    
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

        // await sendPasswordResetSuccessEmail(user.email);
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

const checkPasswordResetToken = async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordTokenExpiresAt: { $gt: Date.now() }
        });

        console.log('Token validation request:', {
            token: req.params.token,
            currentTime: new Date(),
            found: !!user
        });

        if (!user) {
            return res.status(400).json({ isValid: false });
        }

        res.status(200).json({ isValid: true });
    } catch (error) {
        console.error("Token validation error:", error);
        res.status(500).json({ isValid: false });
    }
}

const adminSignup = async (req, res) => {
    const generateUniqueId = async (role) => {
        let newId = `ADMN${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;
        if (role === 'admin') {
            newId = `ADMN${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;
        } else if (role === 'nutritionist') {
            newId = `NUTR${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;
        }
        let isUnique = await User.exists({ _id: newId });
        while (isUnique) {
            if (role === 'admin') {
                newId = `ADMIN${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;
            } else if (role === 'nutritionist') {
                newId = `NUTR${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;
            }
            isUnique = await User.exists({ _id: newId });
        }
        return newId;
    };
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const { email, password, role } = req.body;

    try {
        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Email, password and role are required' });
        }

        if (!emailRegex.test(email) && role !== 'admin' ) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (!['admin', 'nutritionist'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role specification' });
        }

        const userAlreadyExists = await User.findOne({ email });
        if (userAlreadyExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newId = await generateUniqueId(role);
        const hashPassword = await bcrypt.hash(password, 10);

        const userData = {
            _id: newId,
            email,
            password: hashPassword,
            isVerified: role === 'admin' ? true : false,
            role
        };

        if (role === 'admin') {
            userData.firstName = "Admin";
            userData.lastName = newId.slice(-3); 
            userData.sex = 'Admin';
        }
        
        if (role === 'nutritionist') {
            const { firstName, lastName, sex } = req.body;
            if (!firstName || !lastName || !sex) {
                return res.status(400).json({ message: 'Nutritionist requires first name, last name, and sex' });
            }
            userData.firstName = firstName;
            userData.lastName = lastName;
            userData.sex = sex;
            userData.verificationToken = createVerificationToken();
            userData.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
        } 
        userData.birthDate = new Date('2000-01-01');

        const user = new User(userData);
        await user.save();

        if (role === 'nutritionist') {
            await sendVerificationEmail(user.email, user.verificationToken);
        } 
        res.status(201).json({
            success: true,
            message: `${role} created successfully`,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = { signup, adminSignup, createVerificationToken, login, logout, verifyEmail, forgotPassword, resetPassword, checkAuth, checkPasswordResetToken };