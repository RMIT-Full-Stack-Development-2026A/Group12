const express = require('express');
const router = express.Router();
const controller = require('./subscription.controller');

router.post('/deposit', controller.deposit);
router.post('/subscribe', controller.subscribe);

module.exports = router;