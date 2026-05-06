const cron = require('node-cron');
const Payment = require('../models/payment.model');

function startPaymentCleanupJob() {
  // run every minute
  cron.schedule('* * * * *', async () => {
    console.log('Checking expired payments...');

    const now = new Date();

    // expire payments older than 5 minutes
    const expiredTime = new Date(now - 5 * 60 * 1000);

    await Payment.updateMany(
      {
        status: 'PENDING',
        createdAt: { $lt: expiredTime }
      },
      { status: 'FAILED' }
    );
  });
}

module.exports = { startPaymentCleanupJob };