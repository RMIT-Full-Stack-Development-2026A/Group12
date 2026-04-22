const subRepo = require('./subscription.repository');
const walletRepo = require('../wallet/wallet.repository');
const User = require('../../models/user');
const { sendSubscriptionEmail } = require('../../services/email.service');

const PRICE = 10;

async function subscribeWithWallet(userId) {
  const wallet = await walletRepo.findByUserId(userId);

  if (!wallet || wallet.balance < PRICE) {
    throw new Error('Not enough balance');
  }

  await walletRepo.updateBalance(userId, -PRICE);

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  await subRepo.createSubscription({
    userId,
    isPremium: true,
    startDate,
    endDate
  });

  await User.findByIdAndUpdate(userId, { isPremium: true });

  const user = await User.findById(userId);

  await sendSubscriptionEmail(user.email, endDate);

  return { startDate, endDate };
}

async function subscribeQR(userId) {
  // simulate QR payment success
  return subscribeWithWallet(userId); // reuse logic
}

module.exports = {
  subscribeWithWallet,
  subscribeQR
};