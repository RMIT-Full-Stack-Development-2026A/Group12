const express = require('express');
const router = express.Router();
const controller = require('./subscription.controller');
const { verifyToken } = require('../../middleware/auth.middleware');

router.post('/deposit', verifyToken, controller.deposit);
router.post('/subscribe', verifyToken, controller.subscribe);

router.post('/deposit', controller.deposit);
router.post('/subscribe', controller.subscribe);

module.exports = router;