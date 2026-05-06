const walletRepo = require('./wallet.repository');

async function deposit(userId, amount) {
  let wallet = await walletRepo.findByUserId(userId);

  if (!wallet) {
    wallet = await walletRepo.createWallet(userId);
  }

  return walletRepo.updateBalance(userId, amount);
}

async function getWallet(userId) {
  return walletRepo.findByUserId(userId);
}

module.exports = {
  deposit,
  getWallet
};