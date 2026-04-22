const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendSubscriptionEmail(to, endDate) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Subscription Activated',
    text: `Your premium is active until ${endDate}`
  });
}

module.exports = {
  sendSubscriptionEmail
};