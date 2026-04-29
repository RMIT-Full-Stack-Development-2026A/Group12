const subRepo = require('./subscription.repository');
const walletRepo = require('../wallet/wallet.repository');
const User = require('../../models/user');
const { sendSubscriptionEmail } = require('../../services/email.service');
const Transaction = require('../../models/transaction');
const transactionService = require('../transaction/transaction.service');

const PRICE = 100000;

async function subscribeWithWallet(userId) {
  let wallet = await walletRepo.findByUserId(userId);

  if (!wallet) {
  wallet = await walletRepo.createWallet(userId);
  }

  if (wallet.balance < PRICE) {
  throw new Error('Not enough balance');
  }

  await walletRepo.updateBalance(userId, -PRICE);

  await transactionService.createWalletSubscriptionTransaction({
    userId,
    walletId: wallet._id,
    amount: PRICE
  });

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  await subRepo.createSubscription({
    userId,
    isPremium: true,
    startDate,
    endDate
  });

  await paymentRepo.createPayment({
    userId,
    amount: PRICE,
    method: 'WALLET_SUBSCRIPTION',
    status: 'SUCCESS'
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