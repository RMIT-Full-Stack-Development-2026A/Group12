import mongoose from "mongoose";

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

export default mongoose.model("Transaction", TransactionSchema);