const Payment = require('../models/payment.model');

async function createPayment(data) {
  return Payment.create(data);
}

async function findByOrderId(orderId) {
  return Payment.findOne({ orderId });
}

async function updateStatus(orderId, status) {
  return Payment.findOneAndUpdate(
    { orderId },
    { status },
    { new: true }
  );
}

async function getUserPayments(userId) {
  return Payment.find({ userId }).sort({ createdAt: -1 });
}

module.exports = {
  createPayment,
  findByOrderId,
  updateStatus,
  getUserPayments
};