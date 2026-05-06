const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  orderId: String,
  amount: Number,
  method: {
    type: String,
    enum: ['VNPAY', 'QR', 'WALLET_SUBSCRIPTION']
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'PENDING'
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);