import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  balance: {
    type: Number,
    default: 0
  }
});

export default mongoose.model('Wallet', WalletSchema);