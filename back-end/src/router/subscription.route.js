const express = require('express');
const { subscribeWallet, subscribeQR, getMySubscription } = require('../controller/subscription.controller');
const { authenticateJWT } = require('../middleware/jwtAuth');

const router = express.Router();

router.post('/wallet', authenticateJWT, subscribeWallet);
router.post('/qr', authenticateJWT, subscribeQR);
router.get('/me', authenticateJWT, getMySubscription);

module.exports = router;