const GameRoom = require('../models/gameRoom');
const GameSession = require('../models/gameSession');

const ALLOWED_MARKERS = ['X', 'O', 'A', 'B', '△', '○'];
const ALLOWED_BOARD_SIZES = [3, 10, 15];

const generateRoomCode = (length = 6) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
};

const generateUniqueRoomCode = async () => {
  let roomCode;
  let exists = true;

  while (exists) {
    roomCode = generateRoomCode();
    const room = await GameRoom.findOne({ roomCode });
    if (!room) exists = false;
  }

  return roomCode;
};

// CREATE ROOM
const createRoomController = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId || req.body.userId;
    const { marker, boardSize } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const normalizedMarker = String(marker || '').trim();
    const normalizedBoardSize = Number(boardSize);

    if (!ALLOWED_MARKERS.includes(normalizedMarker)) {
      return res.status(400).json({
        success: false,
        message: `Marker must be one of: ${ALLOWED_MARKERS.join(', ')}`
      });
    }

    if (!ALLOWED_BOARD_SIZES.includes(normalizedBoardSize)) {
      return res.status(400).json({
        success: false,
        message: 'Board size must be 3, 10, or 15'
      });
    }

    const roomCode = await generateUniqueRoomCode();

    const room = await GameRoom.create({
      roomCode,
      players: [
        {
          userId,
          mark: normalizedMarker,
          connected: true
        }
      ],
      boardSize: normalizedBoardSize,
      hostMarker: normalizedMarker,
      currentTurn: normalizedMarker,
      status: 'WAITING',
      chat: [],
      startedAt: null
    });

    const session = await GameSession.create({
      player1Id: userId,
      player2Id: null,
      boardSize: normalizedBoardSize,
      gameType: 'ONLINE',
      moves: [],
      result: null,
      startTime: new Date(),
      endTime: null,
      player1Marker: normalizedMarker,
      player2Marker: null
    });

    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: {
        room,
        session,
        shareLink: `${req.protocol}://${req.get('host')}/room/${roomCode}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Create room failed'
    });
  }
};

// JOIN ROOM
const joinRoomController = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { roomCode } = req.params;
    const { marker } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const normalizedMarker = String(marker || '').trim();

    if (!ALLOWED_MARKERS.includes(normalizedMarker)) {
      return res.status(400).json({
        success: false,
        message: `Marker must be one of: ${ALLOWED_MARKERS.join(', ')}`
      });
    }

    const room = await GameRoom.findOne({ roomCode });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (room.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        message: 'Room is closed'
      });
    }

    if (room.players.length >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Room is full'
      });
    }

    const alreadyInRoom = room.players.some(
      (player) => String(player.userId) === String(userId)
    );

    if (alreadyInRoom) {
      return res.status(200).json({
        success: true,
        message: 'You are already in this room',
        data: room
      });
    }

    const usedMarkers = room.players.map((player) => player.mark);

    if (usedMarkers.includes(normalizedMarker)) {
      return res.status(400).json({
        success: false,
        message: 'This marker has already been chosen'
      });
    }

    room.players.push({
      userId,
      mark: normalizedMarker,
      connected: true
    });

    await room.save();

    const session = await GameSession.findOne({
      gameType: 'ONLINE',
      player1Id: room.players[0].userId,
      player2Id: null,
      endTime: null
    }).sort({ createdAt: -1 });

    if (session) {
      session.player2Id = userId;
      session.player2Marker = normalizedMarker;
      await session.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Joined room successfully',
      data: room
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Join room failed'
    });
  }
};

// GET ROOM
const getRoomController = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const room = await GameRoom.findOne({ roomCode }).populate(
      'players.userId',
      'username email'
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Get room failed'
    });
  }
};

// START ROOM
const startRoomController = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { roomCode } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const room = await GameRoom.findOne({ roomCode });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (room.players.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Need 2 players to start'
      });
    }

    const hostId = String(room.players[0].userId);
    if (String(userId) !== hostId) {
      return res.status(403).json({
        success: false,
        message: 'Only host can start the game'
      });
    }

    room.status = 'PLAYING';
    if (!room.startedAt) {
      room.startedAt = new Date();
    }

    await room.save();

    return res.status(200).json({
      success: true,
      message: 'Game started',
      data: room
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Start game failed'
    });
  }
};

module.exports = {
  createRoomController,
  joinRoomController,
  getRoomController,
  startRoomController
};