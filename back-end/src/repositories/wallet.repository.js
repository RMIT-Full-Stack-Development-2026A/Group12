const Wallet = require('../models/wallet');

async function findByUserId(userId) {
  return Wallet.findOne({ userId });
}

async function createWallet(userId) {
  return Wallet.create({ userId, balance: 0 });
}

async function updateBalance(userId, amount) {
  return Wallet.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount } },
    { returnDocument: 'after' }
  );
}

module.exports = {
  findByUserId,
  createWallet,
  updateBalance
};