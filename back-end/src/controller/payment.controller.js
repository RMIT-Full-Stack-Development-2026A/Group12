const paymentService = require('../services/payment.service');
const paymentRepo = require('../repositories/payment.repository');

async function createVNPay(req, res) {
  try {
    const amount = Number(req.body.amount);
    const userId = req.auth.userId;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: 'Amount must be greater than 0'
      });
    }

    const url = await paymentService.createVNPayPayment(
      userId,
      amount
    );

    res.json({ paymentUrl: url });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
}

async function vnpayReturn(req, res) {
  const result = await paymentService.handleVNPayReturn(req.query);

  const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (result.success) {
    return res.redirect(
      `${FRONTEND}/wallet?payment=success`
    );
  }

  return res.redirect(
    `${FRONTEND}/wallet?payment=failed`
  );
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