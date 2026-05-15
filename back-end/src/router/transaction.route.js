const express = require('express');
const router = express.Router();

const controller = require('../controller/transaction.controller');
const { authenticateJWT } = require('../middleware/jwtAuth');

router.get('/history', authenticateJWT, controller.getHistory);

module.exports = router;