const express = require('express');
const { subscribeWallet, subscribeQR } = require('../../controller/subscription.controller');
const { authenticateJWT } = require('../../middleware/jwtAuth');

const router = express.Router();

router.post('/wallet', authenticateJWT, subscribeWallet);
router.post('/qr', authenticateJWT, subscribeQR);

module.exports = router;