const express = require('express');
const router = express.Router();

const {
  createRoomController,
  joinRoomController,
  getRoomController,
  startRoomController,
  makeMoveController
} = require('../controller/roomController');

// Create room / game
router.post('/create', createRoomController);

// Join room
router.post('/join/:roomCode', joinRoomController);

// Get room info
router.get('/:roomCode', getRoomController);

// Start online room
router.post('/:roomCode/start', startRoomController);

// Make move
router.post('/move', makeMoveController);

module.exports = router;