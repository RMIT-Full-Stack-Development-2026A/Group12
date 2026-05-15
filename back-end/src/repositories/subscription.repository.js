const Subscription = require('../models/subscription');

async function createSubscription(data) {
  return Subscription.create(data);
}

async function getActiveSubscription(userId) {
  return Subscription.findOne({
    userId,
    endDate: { $gt: new Date() }
  });
}

module.exports = {
  createSubscription,
  getActiveSubscription
};