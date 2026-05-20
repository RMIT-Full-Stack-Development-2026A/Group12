const subRepo = require('../repositories/subscription.repository');
const walletRepo = require('../repositories/wallet.repository');
const User = require('../models/user');
const { sendSubscriptionEmail } = require('./email.service');
const Transaction = require('../models/transaction');
const transactionService = require('./transaction.service');
const paymentRepo = require('../repositories/payment.repository')
const Subscription = require('../models/subscription');

const PRICE = 100000;

async function subscribeWithWallet(userId) {
  let wallet = await walletRepo.findByUserId(userId);

  if (!wallet) {
    wallet = await walletRepo.createWallet(userId);
  }

  if (wallet.balance < PRICE) {
    throw new Error('Not enough balance');
  }

  try {
    await walletRepo.updateBalance(userId, -PRICE);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await Subscription.findOneAndUpdate(
      { userId },
      {
        isPremium: true,
        startDate,
        endDate
      },
      {
        upsert: true,
        new: true
      }
    );

    await transactionService.createWalletSubscriptionTransaction({
      userId,
      walletId: wallet._id,
      amount: PRICE
    });

    await paymentRepo.createPayment({
      userId,
      amount: PRICE,
      method: 'WALLET_SUBSCRIPTION',
      status: 'SUCCESS'
    });

    await User.findByIdAndUpdate(userId, {
      isPremium: true,
      premiumExpiryDate: endDate
    });

    const user = await User.findById(userId);

    await sendSubscriptionEmail(user.email, endDate);

    return { startDate, endDate };

  } catch (err) {

    // refund wallet if anything fails
    await walletRepo.updateBalance(userId, PRICE);

    throw err;
  }
}

// async function subscribeQR(userId) {
//   return subscribeWithWallet(userId); 
// }

module.exports = {
  subscribeWithWallet
  // subscribeQR
};