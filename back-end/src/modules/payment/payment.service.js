const { v4: uuidv4 } = require('uuid');
const paymentRepo = require('./payment.repository');
const Wallet = require('../../models/wallet');
const Subscription = require('../../models/subscription');
const User = require('../../models/user');
const { sendSubscriptionEmail } = require('../../services/email.service');
const Transaction = require('../../models/transaction');
const transactionService = require('../transaction/transaction.service');

// ✅ CREATE PAYMENT (FAKE VNPAY)
async function createVNPayPayment(userId, amount) {
  const orderId = uuidv4();

  await paymentRepo.createPayment({
    userId,
    orderId,
    amount,
    method: 'VNPAY',
    status: 'PENDING'
  });

  // 👉 Return fake VNPay URL
  return `${process.env.BASE_URL}/fake-vnpay?orderId=${orderId}&amount=${amount}`;
}

async function createSubscriptionPayment(userId) {
  const orderId = uuidv4();
  const PRICE = 100000;

  await paymentRepo.createPayment({
    userId,
    orderId,
    amount: PRICE,
    method: 'QR',
    status: 'PENDING'
  });

  return `${process.env.BASE_URL}/qr-payment?orderId=${orderId}&amount=${PRICE}`;
}


// ✅ HANDLE CALLBACK
async function handleVNPayReturn(query) {
  const { vnp_TxnRef, vnp_ResponseCode, vnp_Amount, type } = query;

  const payment = await paymentRepo.findByOrderId(vnp_TxnRef);
  if (!payment) throw new Error('Payment not found');

  if (vnp_ResponseCode === '00') {
    const amount = payment.amount;

    // 💰 WALLET FLOW
    if (type === 'wallet') {
      const wallet = await Wallet.findOneAndUpdate(
        { userId: payment.userId },
        { $inc: { balance: amount } },
        { upsert: true, new: true }
      );

      // ✅ CREATE TRANSACTION
    await transactionService.createDepositTransaction({
      userId: payment.userId,
      walletId: wallet._id,
      paymentId: payment._id,
      amount
    });
    }

    // ✅ DIRECT SUBSCRIPTION (NO WALLET)
    if (payment.method === 'QR') {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await Subscription.create({
      userId: payment.userId,
      isPremium: true,
      startDate,
      endDate
    });

  const user = await User.findByIdAndUpdate(
    payment.userId,
    { isPremium: true },
    { new: true }
  );

  const wallet = await Wallet.findOne({ userId: payment.userId });

  await transactionService.createQRSubscriptionTransaction({
    userId: payment.userId,
    walletId: wallet?._id,
    paymentId: payment._id,
    amount: payment.amount
  });

  // 📧 SEND EMAIL
  await sendSubscriptionEmail(user.email, endDate);
}

    await paymentRepo.updateStatus(vnp_TxnRef, 'SUCCESS');

    return { success: true };
  }

  await paymentRepo.updateStatus(vnp_TxnRef, 'FAILED');
  return { success: false };
}


// ✅ EXPORT (VERY IMPORTANT)
module.exports = {
  createVNPayPayment,
  handleVNPayReturn,
  createSubscriptionPayment
};