const service = require('./payment.service');

exports.create = async (req, res) => {
  const payment = await service.createPayment(req.user.userId);

  res.json({
    message: 'Payment created',
    transactionId: payment.transactionId
  });
};

exports.webhook = async (req, res) => {
  const { transactionId } = req.body;

  await service.handleWebhook(transactionId);

  res.json({ message: 'Payment confirmed' });
};