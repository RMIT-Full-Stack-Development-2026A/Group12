// const express = require('express');
// const router = express.Router();

// const {
//   createRoomController,
//   joinRoomController,
//   getRoomController,
//   startRoomController,
//   makeMoveController,
//   getSessionByRoomController
// } = require('../controller/game.controller');

// const { validateJoinRoomDto } = require('../dtos/join-room.dto');
// const gameService = require('../services/game.service');

// // Create room / game
// router.post('/create', createRoomController);

// // Join room
// router.post('/join/:roomCode', joinRoomController);

// // Get room info
// router.get('/:roomCode', getRoomController);

// // Get session by room code
// router.get('/:roomCode/session', getSessionByRoomController);

// // Start online room
// router.post('/:roomCode/start', startRoomController);

// // Make move
// router.post('/move', makeMoveController);

// module.exports = router;
const express = require('express');
const router = express.Router();

const {
  createRoomController,
  joinRoomController,
  getRoomController,
  startRoomController,
  makeMoveController,
  getSessionByRoomController,
  playAgainController
} = require('../controller/game.controller');

const {
  surrenderGameController
} = require('../controller/roomController');

// Create room / game
router.post('/create', createRoomController);

// Join room
router.post('/join/:roomCode', joinRoomController);

// Get room info
router.get('/:roomCode', getRoomController);

// Get current session by room code
router.get('/:roomCode/session', getSessionByRoomController);

// Start online room
router.post('/:roomCode/start', startRoomController);

// Play again in same room
router.post('/:roomCode/play-again', playAgainController);

// Make move
router.post('/move', makeMoveController);

// Surrender current game
router.post('/surrender', surrenderGameController);

module.exports = router;