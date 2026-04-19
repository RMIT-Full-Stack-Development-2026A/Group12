const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: String,
  amount: Number,
  status: { type: String, default: 'PENDING' },
  transactionId: String
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);