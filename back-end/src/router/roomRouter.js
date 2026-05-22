const express = require('express');
const router = express.Router();

const {
  createRoomController,
  joinRoomController,
  getRoomController,
  startRoomController,
  makeMoveController,
  getSessionByRoomController,
  playAgainController,
  listWaitingRoomsController,
  closeRoomController,
  listMyDuelingEntriesController,
  getSessionByIdController,
  sendChatMessageController,
  getChatHistoryController,
} = require('../controller/game.controller');

const { authenticateJWT } = require('../middleware/jwtAuth');

const {
  surrenderGameController
} = require('../controller/roomController');

// Create room / game
router.post('/create', createRoomController);

// Join room
router.post('/join/:roomCode', joinRoomController);

// List waiting rooms (arena) — must be before /:roomCode to avoid conflict
router.get('/arena', listWaitingRoomsController);

// My active dueling entries (requires auth)
router.get('/my-rooms', authenticateJWT, listMyDuelingEntriesController);

// Get session by ID (requires auth, for SINGLE/LOCAL rejoin)
router.get('/session/:sessionId', authenticateJWT, getSessionByIdController);

// Chat for ONLINE sessions (requires auth)
router.get('/session/:sessionId/chat', authenticateJWT, getChatHistoryController);
router.post('/session/:sessionId/chat', authenticateJWT, sendChatMessageController);

// Get room info
router.get('/:roomCode', getRoomController);

// Get current session by room code
router.get('/:roomCode/session', getSessionByRoomController);

// Start online room
router.post('/:roomCode/start', startRoomController);

// Play again in same room
router.post('/:roomCode/play-again', playAgainController);

// Close room (host only)
router.post('/:roomCode/close', closeRoomController);

// Make move
router.post('/move', makeMoveController);

// Surrender current game
router.post('/surrender', surrenderGameController);

module.exports = router;