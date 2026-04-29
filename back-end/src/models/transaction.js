const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  amount: Number,
  type: {
    type: String,
    enum: ['DEPOSIT', 'SUBSCRIPTION']
  },
  method: {
    type: String,
    enum: ['VNPAY', 'QR', 'WALLET']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);