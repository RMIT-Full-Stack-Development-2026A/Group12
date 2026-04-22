const express = require('express');
const router = express.Router();

const {
  createRoomController,
  joinRoomController,
  getRoomController,
  startRoomController,
  makeMoveController,
  getSessionByRoomController
} = require('../controller/roomController');

// Create room / game
router.post('/create', createRoomController);

// Join room
router.post('/join/:roomCode', joinRoomController);

// Get room info
router.get('/:roomCode', getRoomController);

// Get session by room code
router.get('/:roomCode/session', getSessionByRoomController);

// Start online room
router.post('/:roomCode/start', startRoomController);

// Make move
router.post('/move', makeMoveController);

// Surrender current game
router.post('/surrender', surrenderGameController);

module.exports = router;