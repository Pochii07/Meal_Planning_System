const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // check if this is a verification token being used for regular access
        if (decoded.isVerificationToken && req.path !== '/verify-login') {
            return res.status(403).json({
                success: false,
                message: 'Account not verified',
                requiresVerification: true
            });
        }
        req.userId = decoded.userId;
        req.isVerificationToken = decoded.isVerificationToken || false;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        
        let message = 'Invalid token';
        if (error.name === 'TokenExpiredError') {
            message = 'Session expired';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Invalid authentication';
        }

        return res.status(401).json({
            success: false,
            message
        });
    }
}

module.exports = { verifyToken };
