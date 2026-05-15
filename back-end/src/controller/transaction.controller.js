const Payment = require('../models/payment.model');

async function getHistory(req, res) {
  const data = await Payment.find({
    userId: req.auth.userId,
    status: {
      $in: ['PENDING', 'SUCCESS']
    }
  }).sort({ createdAt: -1 });

  res.json(data);
}

module.exports = {
  getHistory
};