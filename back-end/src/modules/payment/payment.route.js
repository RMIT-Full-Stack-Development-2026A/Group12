const express = require('express');
const {
  createVNPay,
  vnpayReturn,
  getHistory
} = require('./payment.controller');

const { authenticateJWT } = require('../../middleware/jwtAuth');

const router = express.Router();

router.post('/vnpay', authenticateJWT, createVNPay);
router.get('/vnpay-return', vnpayReturn);
router.get('/history', authenticateJWT, getHistory);

module.exports = router;