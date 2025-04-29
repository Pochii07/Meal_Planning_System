const express = require('express')
const { signup, adminSignup, login, logout, verifyEmail, forgotPassword, resetPassword, checkAuth, checkPasswordResetToken } = require('../controllers/auth_controller.js')
const { verifyToken } = require('../middleware/verifyToken.js')

const router = express.Router();

router.post("/signup", signup);
router.post("/admin_signup", adminSignup);
router.post("/login", login);  
router.post("/logout", logout);
router.post("/verify_login", verifyEmail);
router.post("/forgot_password", forgotPassword);
router.post("/reset_password/:token", resetPassword);

// for level of access
router.get("/check_auth", verifyToken, checkAuth)
router.get("/check_reset_token/:token", checkPasswordResetToken)



module.exports = router
