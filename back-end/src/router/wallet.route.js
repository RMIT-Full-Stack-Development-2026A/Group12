const express = require('express');
const { deposit, getWallet } = require('../../controller/wallet.controller');
const { authenticateJWT } = require('../../middleware/jwtAuth');

const router = express.Router();

router.post('/deposit', authenticateJWT, deposit);
router.get('/', authenticateJWT, getWallet);

module.exports = router;