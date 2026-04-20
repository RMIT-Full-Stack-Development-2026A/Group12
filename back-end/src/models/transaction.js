const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  walletId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  type: {
    type: String,
    enum: ['DEPOSIT', 'SUBSCRIPTION']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);