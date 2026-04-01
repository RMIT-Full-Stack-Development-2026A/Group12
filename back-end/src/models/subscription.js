const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPremium: Boolean,
  startDate: Date,
  endDate: Date
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);