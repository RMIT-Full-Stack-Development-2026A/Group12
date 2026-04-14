const express = require('express');
const { createRoom } = require('../controller/roomController');

const router = express.Router();

router.post('/create', createRoom);

module.exports = router;