const Payment = require('../../models/payment.model');
const User = require('../../models/user.model');

exports.createPayment = async (userId) => {
  const payment = await Payment.create({
    userId,
    amount: 10,
    transactionId: 'TXN_' + Date.now()
  });

  return payment;
};

exports.handleWebhook = async (transactionId) => {
  const payment = await Payment.findOne({ transactionId });

  if (!payment) throw new Error('Payment not found');

  payment.status = 'SUCCESS';
  await payment.save();

  const user = await User.findById(payment.userId);
  user.isPremium = true;
  await user.save();

  return payment;
};