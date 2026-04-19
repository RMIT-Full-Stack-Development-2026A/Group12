const express = require('express');
const router = express.Router();
const controller = require('./payment.controller');
const { verifyToken } = require('../../middleware/auth.middleware');

router.post('/create', verifyToken, controller.create);
router.post('/webhook', controller.webhook);

module.exports = router;