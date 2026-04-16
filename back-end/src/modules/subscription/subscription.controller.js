const service = require('./subscription.service');

exports.deposit = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    const user = await service.deposit(userId, amount);

    res.json({
      message: 'Deposit successful',
      walletBalance: user.walletBalance
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.subscribe = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await service.subscribe(userId);

    res.json({
      message: 'Subscription successful',
      isPremium: user.isPremium,
      walletBalance: user.walletBalance
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};