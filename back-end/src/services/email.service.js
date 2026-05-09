const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendSubscriptionEmail(to, endDate) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Subscription Activated',
      text: `Your premium is active until ${endDate}`
    });

    console.log('Email sent');
  } catch (err) {
    console.error('Email failed:', err.message);

    // do NOT crash payment flow
    return null;
  }
}

module.exports = { sendSubscriptionEmail };