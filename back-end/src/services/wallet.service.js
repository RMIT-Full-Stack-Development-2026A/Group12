const walletRepo = require('../repositories/wallet.repository');

async function deposit(userId, amount) {
  let wallet = await walletRepo.findByUserId(userId);

  if (!wallet) {
    wallet = await walletRepo.createWallet(userId);
  }

  return walletRepo.updateBalance(userId, amount);
}

async function withdraw(userId, amount) {
  let wallet = await walletRepo.findByUserId(userId);

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }

  return walletRepo.updateBalance(userId, -amount);
}

async function getWallet(userId) {
  let wallet = await walletRepo.findByUserId(userId);

  if (!wallet) {
    wallet = await walletRepo.createWallet(userId);
  }

  return wallet;
}

module.exports = {
  deposit,
  withdraw,
  getWallet
};