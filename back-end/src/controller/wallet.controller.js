const walletService = require('../modules/wallet/wallet.service');

async function deposit(req, res) {
  try {
    const userId = req.auth.userId;
    const { amount } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const wallet = await walletService.deposit(userId, amount);

    res.json({
      message: 'Deposit successful',
      wallet
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getWallet(req, res) {
  const wallet = await walletService.getWallet(req.auth.userId);
  res.json(wallet);
}

module.exports = {
  deposit,
  getWallet
};