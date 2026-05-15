const express = require('express');
const {
  createVNPay,
  vnpayReturn,
  getHistory,
  createSubscriptionPayment,
  getStatus
} = require('../controller/payment.controller');

const { authenticateJWT } = require('../middleware/jwtAuth');

const router = express.Router();

router.post('/vnpay', authenticateJWT, createVNPay);
router.get('/vnpay-return', vnpayReturn);
router.get('/history', authenticateJWT, getHistory);
router.post('/subscribe', authenticateJWT, createSubscriptionPayment);
router.get('/status', getStatus);

module.exports = router;