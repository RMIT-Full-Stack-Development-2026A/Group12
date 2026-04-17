const express = require('express');
const router = express.Router();

const {
  createRoomController,
  joinRoomController,
  getRoomController,
  startRoomController
} = require('../controller/roomController');

// Create room
router.post('/create', createRoomController);

// Join room
router.post('/join/:roomCode', joinRoomController);

// Get room info
router.get('/:roomCode', getRoomController);

// Start game
router.post('/:roomCode/start', startRoomController);

module.exports = router;