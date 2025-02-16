const express = require('express')
const { signup, login, logout, verifyEmail, forgotPassword, resetPassword, checkAuth } = require('../controllers/auth_controller.js')
const { verifyToken } = require('../middleware/verifyToken.js')

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);  
router.post("/logout", logout);
router.post("/verify_email", verifyEmail);
router.post("/forgot_password", forgotPassword);
router.post("/reset_password/:token", resetPassword);

// for level of access
router.get("/check_auth", verifyToken, checkAuth)

module.exports = router
