const paymentService = require('./payment.service');
const paymentRepo = require('./payment.repository');

async function createVNPay(req, res) {
  const { amount } = req.body;
  const userId = req.auth.userId;

  const url = await paymentService.createVNPayPayment(userId, amount);

  res.json({ paymentUrl: url });
}

async function vnpayReturn(req, res) {
  const result = await paymentService.handleVNPayReturn(req.query);

  if (result.success) {
    return res.send("Payment success");
  }

  return res.send("Payment failed");
}

// 📊 Transaction history
async function getHistory(req, res) {
  const history = await paymentRepo.getUserPayments(req.auth.userId);
  res.json(history);
}

module.exports = {
  createVNPay,
  vnpayReturn,
  getHistory
};