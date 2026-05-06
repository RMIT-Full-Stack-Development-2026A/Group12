const Transaction = require('../models/transaction');

// Deposit (VNPay → Wallet)
async function createDepositTransaction({ userId, walletId, paymentId, amount }) {
  return Transaction.create({
    userId,
    walletId,
    paymentId,
    amount,
    type: 'DEPOSIT',
    method: 'VNPAY'
  });
}

// Subscription via QR
async function createQRSubscriptionTransaction({ userId, walletId, paymentId, amount }) {
  return Transaction.create({
    userId,
    walletId,
    paymentId,
    amount,
    type: 'SUBSCRIPTION',
    method: 'QR'
  });
}

// Subscription via Wallet
async function createWalletSubscriptionTransaction({ userId, walletId, amount }) {
  return Transaction.create({
    userId,
    walletId,
    amount,
    type: 'SUBSCRIPTION',
    method: 'WALLET'
  });
}

module.exports = {
  createDepositTransaction,
  createQRSubscriptionTransaction,
  createWalletSubscriptionTransaction
};