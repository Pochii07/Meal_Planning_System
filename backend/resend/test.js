const { resend } = require('./config');

const sendTestEmail = async () => {
    try {
        const response = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: ['dbleagueplayer111@gmail.com'], // Replace with your actual email
            subject: 'Test Email from Resend API',
            html: '<p>This is a test email sent using Resend API.</p>'
        });

        console.log('Email sent successfully:', response);
    } catch (error) {
        console.error('Error sending test email:', error);
    }
};

sendTestEmail();
