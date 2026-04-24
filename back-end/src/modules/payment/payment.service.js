const { v4: uuidv4 } = require('uuid');
const paymentRepo = require('./payment.repository');
const Wallet = require('../../models/wallet');

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
  return `http://localhost:5173/fake-vnpay?orderId=${orderId}&amount=${amount}`;
}


// ✅ HANDLE CALLBACK
async function handleVNPayReturn(query) {
  const { vnp_TxnRef, vnp_ResponseCode, vnp_Amount } = query;

  const payment = await paymentRepo.findByOrderId(vnp_TxnRef);
  if (!payment) throw new Error('Payment not found');

  if (vnp_ResponseCode === '00') {
    const amount = vnp_Amount / 100;

    await Wallet.findOneAndUpdate(
      { userId: payment.userId },
      { $inc: { balance: amount } },
      { upsert: true }
    );

    await paymentRepo.updateStatus(vnp_TxnRef, 'SUCCESS');

    return { success: true };
  }

  await paymentRepo.updateStatus(vnp_TxnRef, 'FAILED');
  return { success: false };
}


// ✅ EXPORT (VERY IMPORTANT)
module.exports = {
  createVNPayPayment,
  handleVNPayReturn
};