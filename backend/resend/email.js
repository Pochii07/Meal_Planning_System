const { resend } = require('./config.js');
const { verifyEmailTemplate, resetPasswordEmailTemplate } = require('./email_template.js');

const sendVerificationEmail = async (email, verificationToken) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'ChefIT <support@chefit.live>',
            to: [email],
            subject: 'Email Address Verification',
            html: 
                verifyEmailTemplate.replace(
                    "{verificationToken}",
                    verificationToken
                ),
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

const sendWelcomeEmail = async (email, name) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'ChefIT <support@chefit.live>',
            to: [email],
            subject: 'Welcome to MPS',
            html: `Welcome to Meal Planning System!`,
          });
    } catch (error) {
        console.log("Error: ", error);
        throw new Error("Error sending verification email");
    }
}

const sendPasswordResetEmail = async (email, firstName, resetURL) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'ChefIT <support@chefit.live>',
            to: [email],
            subject: 'Password Reset',
            html:
                resetPasswordEmailTemplate
                    .replace("{resetURL}", resetURL)
                    .replace("{firstName}", firstName),
          });
    } catch (error) {
        console.log("Error: ", error);
    }
}

const sendPasswordResetSuccessEmail = async (email, verificationToken) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'ChefIT <support@chefit.live>',
            to: [email],
            subject: 'Reset Password Successful',
            html: `Password reset`,
          });
    } catch (error) {
        console.log("Error: ", error);
    }
}

module.exports = { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendPasswordResetSuccessEmail};
