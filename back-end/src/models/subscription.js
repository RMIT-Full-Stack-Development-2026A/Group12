import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPremium: Boolean,
  startDate: Date,
  endDate: Date
});

export default  mongoose.model('Subscription', SubscriptionSchema);