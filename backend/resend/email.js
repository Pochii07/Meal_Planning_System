const { resend } = require('./config');

const sendVerificationEmail = async (email, verificationToken) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: [email],
            subject: 'Email Address Verification',
            html: `Verify your email address with this token: ${verificationToken}`,
          });
    } catch (error) {
        console.log("error: ". error);
        throw new Error("Error sending verification email");
    }
}

const sendWelcomeEmail = async (email, verificationToken) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: [email],
            subject: 'Email Address Verification',
            html: `Verify your email address with this token: ${verificationToken}`,
          });
    } catch (error) {
        console.log("error: ". error);
        throw new Error("Error sending verification email");
    }
}

module.exports = { sendVerificationEmail, sendWelcomeEmail };
