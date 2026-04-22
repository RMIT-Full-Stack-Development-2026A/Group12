const GameRoom = require('../models/gameRoom');
const GameSession = require('../models/gameSession');
const { getIO } = require('../socket');
const { createBoard, placeMarker, getGameStatus } = require('../utils/board');

const ALLOWED_MARKERS = ['X', 'O', 'A', 'B', '△', '○'];
const ALLOWED_BOARD_SIZES = [3, 10, 15];
const ALLOWED_GAME_MODES = ['LOCAL', 'SINGLE', 'ONLINE'];
const ALLOWED_AI_LEVELS = ['easy', 'medium', 'hard'];

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

const createRoomController = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { gameMode, marker, boardSize, aiLevel } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'userId is required'
      });
    }

    if (!ALLOWED_GAME_MODES.includes(gameMode)) {
      return res.status(400).json({
        success: false,
        message: 'gameMode must be LOCAL, SINGLE, or ONLINE'
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

    if (gameMode === 'SINGLE') {
      if (!ALLOWED_AI_LEVELS.includes(aiLevel || 'easy')) {
        return res.status(400).json({
          success: false,
          message: 'aiLevel must be easy, medium, or hard'
        });
      }

      const botMarker =
        ALLOWED_MARKERS.find((item) => item !== normalizedMarker) || 'O';

      const session = await GameSession.create({
        player1Id: userId,
        player2Id: null,
        player1Marker: normalizedMarker,
        player2Marker: botMarker,
        aiLevel: aiLevel || 'easy',
        boardSize: normalizedBoardSize,
        gameType: 'SINGLE',
        board: createBoard(normalizedBoardSize),
        currentTurn: normalizedMarker,
        roomCode: null,
        status: 'PLAYING',
        winner: null,
        moves: [],
        result: null,
        startTime: new Date(),
        endTime: null
      });

      return res.status(201).json({
        success: true,
        message: 'Single game created successfully',
        data: session
      });
    }

    if (gameMode === 'LOCAL') {
      const secondMarker =
        ALLOWED_MARKERS.find((item) => item !== normalizedMarker) || 'O';

      const session = await GameSession.create({
        player1Id: userId,
        player2Id: null,
        player1Marker: normalizedMarker,
        player2Marker: secondMarker,
        roomCode: null,
        boardSize: normalizedBoardSize,
        gameType: 'LOCAL',
        board: createBoard(normalizedBoardSize),
        currentTurn: normalizedMarker,
        status: 'PLAYING',
        winner: null,
        moves: [],
        result: null,
        startTime: new Date(),
        endTime: null
      });

      return res.status(201).json({
        success: true,
        message: 'Local game created successfully',
        data: session
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
      player1Marker: normalizedMarker,
      player2Marker: null,
      roomCode: roomCode,
      boardSize: normalizedBoardSize,
      gameType: 'ONLINE',
      board: createBoard(normalizedBoardSize),
      currentTurn: normalizedMarker,
      status: 'WAITING',
      winner: null,
      moves: [],
      result: null,
      startTime: new Date(),
      endTime: null
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

const joinRoomController = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { roomCode } = req.params;
    const { marker } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'userId is required'
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

    const io = getIO();
    io.to(roomCode).emit('room_updated', room);

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

const startRoomController = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { roomCode } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'userId is required'
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

    const session = await GameSession.findOne({
      gameType: 'ONLINE',
      player1Id: room.players[0].userId,
      endTime: null
    }).sort({ createdAt: -1 });

    if (session) {
      session.status = 'PLAYING';
      await session.save();
    }

    const io = getIO();
    io.to(roomCode).emit('room_started', room);
    io.to(roomCode).emit('room_updated', room);

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

const makeMoveController = async (req, res) => {
  try {
    const { sessionId, row, col, marker } = req.body;

    if (!sessionId || row === undefined || col === undefined || !marker) {
      return res.status(400).json({
        success: false,
        message: 'sessionId, row, col, and marker are required'
      });
    }

    const session = await GameSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (!session.board) {
      return res.status(400).json({
        success: false,
        message: 'Board has not been initialized'
      });
    }

    if (session.status === 'WIN' || session.status === 'DRAW' || session.status === 'FINISHED') {
      return res.status(400).json({
        success: false,
        message: 'Game already finished'
      });
    }

    if (session.currentTurn !== marker) {
      return res.status(400).json({
        success: false,
        message: 'Not your turn'
      });
    }

    const nextBoard = session.board.map((boardRow) => [...boardRow]);

    try {
      placeMarker(nextBoard, Number(row), Number(col), marker);
    } catch (placeError) {
      return res.status(400).json({
        success: false,
        message: placeError.message || 'Invalid move'
      });
    }

    const nextMoves = [
      ...session.moves,
      {
        moveNumber: session.moves.length + 1,
        player: marker,
        position: `${row},${col}`,
        timestamp: new Date()
      }
    ];

    const gameStatus = getGameStatus(nextBoard, Number(row), Number(col));

    session.board = nextBoard;
    session.moves = nextMoves;

    if (gameStatus.status === 'WIN') {
      session.status = 'WIN';
      session.winner = gameStatus.winner;
      session.result =
        marker === session.player1Marker ? 'PLAYER1_WIN' : 'PLAYER2_WIN';
      session.endTime = new Date();
    } else if (gameStatus.status === 'DRAW') {
      session.status = 'DRAW';
      session.winner = null;
      session.result = 'DRAW';
      session.endTime = new Date();
    } else {
      session.status = 'PLAYING';
      session.currentTurn =
        marker === session.player1Marker
          ? session.player2Marker || session.player1Marker
          : session.player1Marker;
    }

    await session.save();

    const io = getIO();
     if (session.roomCode) {
        const io = getIO();
        io.to(session.roomCode).emit('session_updated', session);
    }

    return res.status(200).json({
      success: true,
      message: 'Move played successfully',
      data: session
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Make move failed'
    });
  }
};
const getSessionByRoomController = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const session = await GameSession.findOne({
      roomCode,
      gameType: 'ONLINE',
      endTime: null
    }).sort({ createdAt: -1 });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Get session failed'
    });
  }
};
module.exports = {
  createRoomController,
  joinRoomController,
  getRoomController,
  startRoomController,
  makeMoveController,
  getSessionByRoomController
};