const subService = require('./subscription.service');

async function subscribeWallet(req, res) {
  try {
    const result = await subService.subscribeWithWallet(req.auth.userId);
    res.json({ message: 'Subscribed successfully', result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function subscribeQR(req, res) {
  const result = await subService.subscribeQR(req.auth.userId);
  res.json({ message: 'QR Payment success', result });
}

module.exports = {
  subscribeWallet,
  subscribeQR
};