const express = require('express');
const { deposit, getWallet, withdraw } = require('../controller/wallet.controller');
const { authenticateJWT } = require('../middleware/jwtAuth');

const router = express.Router();

router.post('/deposit', authenticateJWT, deposit);
router.get('/', authenticateJWT, getWallet);
router.post('/withdraw', authenticateJWT, withdraw);

module.exports = router;