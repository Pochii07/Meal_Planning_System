const { Resend } = require('resend');
const dotenv = require('dotenv');
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log("Loaded API Key:", process.env.RESEND_API_KEY); // Debugging line

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = { resend };
