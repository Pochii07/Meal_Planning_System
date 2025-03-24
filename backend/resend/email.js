const { resend } = require('./config.js');

const sendVerificationEmail = async (email, verificationToken) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: [email],
            subject: 'Email Address Verification',
            html: `Verify your email address with this token: ${verificationToken}`,
          });

          if (error) {
            console.error("API error:", error);
            throw new Error("Failed to send verification email");
        }

        console.log("Verification email sent successfully:", data);
    } catch (error) {
        console.log("Error:", error);
        throw new Error("Error sending verification email");
    }
}

const sendWelcomeEmail = async (email, verificationToken) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: [email],
            subject: 'Welcome to MPS',
            html: `Welcome to Meal Planning System!`,
          });
    } catch (error) {
        console.log("Error: ", error);
        throw new Error("Error sending verification email");
    }
}

const sendPasswordResetEmail = async (email, resetURL) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: [email],
            subject: 'Password Reset',
            html: `Click <a href= "${resetURL}">here</a> to reset your password`,
          });
    } catch (error) {
        console.log("Error: ", error);
    }
}

const sendPasswordResetSuccessEmail = async (email, verificationToken) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: [email],
            subject: 'Reset Password Successful',
            html: `Password reset`,
          });
    } catch (error) {
        console.log("Error: ", error);
    }
}

module.exports = { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendPasswordResetSuccessEmail };
