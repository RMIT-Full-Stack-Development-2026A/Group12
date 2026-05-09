const { v4: uuidv4 } = require('uuid');
const paymentRepo = require('../repositories/payment.repository');
const Wallet = require('../models/wallet');
const Subscription = require('../models/subscription');
const User = require('../models/user');
const { sendSubscriptionEmail } = require('./email.service');
const transactionService = require('./transaction.service');


// =====================
// CREATE WALLET PAYMENT
// =====================
async function createVNPayPayment(userId, amount) {
  if (!amount || amount <= 0) {
    throw new Error('Invalid payment amount');
  }

  const orderId = uuidv4();

  const paymentUrl =
    `${process.env.BASE_URL}/fake-vnpay?orderId=${orderId}&amount=${amount}`;

  await paymentRepo.createPayment({
    userId,
    orderId,
    amount,
    method: 'VNPAY',
    status: 'PENDING',
    description: 'Deposit to wallet via VNPay',
    paymentUrl
  });

  return paymentUrl;
}


// =====================
// CREATE QR SUB PAYMENT
// =====================
async function createSubscriptionPayment(userId) {
  const orderId = uuidv4();
  const PRICE = 100000;

  const paymentUrl =
    `${process.env.BASE_URL}/qr-payment?orderId=${orderId}&amount=${PRICE}`;

  await paymentRepo.createPayment({
    userId,
    orderId,
    amount: PRICE,
    method: 'QR',
    status: 'PENDING',
    description: 'Subscription payment via QR code',
    paymentUrl
  });

  return paymentUrl;
}


// =====================
// HANDLE CALLBACK
// =====================
async function handleVNPayReturn(query) {
  const {
    vnp_TxnRef,
    vnp_ResponseCode,
    type
  } = query;

  const payment = await paymentRepo.findByOrderId(vnp_TxnRef);

  if (!payment) {
    throw new Error('Payment not found');
  }

  // Prevent duplicate processing
  if (payment.status === 'SUCCESS') {
    return { success: true };
  }

  if (payment.status === 'FAILED') {
    return { success: false };
  }

  if (vnp_ResponseCode === '00') {

    // lock first
    await paymentRepo.updateStatus(vnp_TxnRef, 'SUCCESS');

    const amount = payment.amount;

    // WALLET TOPUP
    if (type === 'wallet') {
      const wallet = await Wallet.findOneAndUpdate(
        { userId: payment.userId },
        { $inc: { balance: amount } },
        { upsert: true, new: true }
      );

      await transactionService.createDepositTransaction({
        userId: payment.userId,
        walletId: wallet._id,
        paymentId: payment._id,
        amount
      });
    }

    // QR SUBSCRIPTION
    if (payment.method === 'QR') {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      await Subscription.findOneAndUpdate(
        { userId: payment.userId },
        {
          isPremium: true,
          startDate,
          endDate
        },
        {
          upsert: true,
          new: true
        }
      );

      const user = await User.findByIdAndUpdate(
        payment.userId,
        { isPremium: true },
        { new: true }
      );

      const wallet = await Wallet.findOne({
        userId: payment.userId
      });

      await transactionService.createQRSubscriptionTransaction({
        userId: payment.userId,
        walletId: wallet?._id,
        paymentId: payment._id,
        amount
      });

      await sendSubscriptionEmail(
        user.email,
        endDate
      );
    }

    return { success: true };
  }

  await paymentRepo.updateStatus(
    vnp_TxnRef,
    'FAILED'
  );

  return { success: false };
}


// =====================
// EXPORT
// =====================
module.exports = {
  createVNPayPayment,
  createSubscriptionPayment,
  handleVNPayReturn
};