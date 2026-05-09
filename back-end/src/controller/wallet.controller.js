const walletService = require('../services/wallet.service');

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

async function withdraw(req, res) {
  if (!amount || amount <= 0) {
  return res.status(400).json({
    message: 'Invalid amount'
  });
  }
  
  try {
    const userId = req.auth.userId;
    const { amount } = req.body;

    if (amount <= 0) {
      return res.status(400).json({
        message: 'Invalid amount'
      });
    }

    const wallet = await walletService.withdraw(userId, amount);

    res.json({
      message: 'Withdraw successful',
      wallet
    });

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
}

async function getWallet(req, res) {
  const wallet = await walletService.getWallet(req.auth.userId);
  res.json(wallet);
}

module.exports = {
  deposit,
  withdraw,
  getWallet
};