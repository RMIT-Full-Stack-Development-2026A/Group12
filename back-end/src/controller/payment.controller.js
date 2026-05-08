const paymentService = require('../services/payment.service');
const paymentRepo = require('../repositories/payment.repository');

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

async function createSubscriptionPayment(req, res) {
  const userId = req.auth.userId;

  const url = await paymentService.createSubscriptionPayment(userId);

  res.json({ paymentUrl: url });
}

// Transaction history
async function getHistory(req, res) {
  const history = await paymentRepo.getUserPayments(req.auth.userId);
  res.json(history);
}

async function getStatus(req, res) {
  const { orderId } = req.query;

  const payment = await paymentRepo.findByOrderId(orderId);

  if (!payment) {
    return res.status(404).json({ status: 'NOT_FOUND' });
  }

  res.json({ status: payment.status });
}

module.exports = {
  createVNPay,
  vnpayReturn,
  getHistory,
  createSubscriptionPayment,
  getStatus
};