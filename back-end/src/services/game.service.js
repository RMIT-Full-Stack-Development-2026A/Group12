const { getIO } = require('../socket');
const { createBoard, placeMarker, getGameStatus } = require('../utils/board');
const { ALLOWED_MARKERS } = require('../constants/enums');
const roomRepo = require('../repositories/gameRoom.repository');
const sessionRepo = require('../repositories/gameSession.repository');
const { generateRoomCode } = require('../utils/roomCode');

const buildError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const generateUniqueRoomCode = async () => {
  let roomCode;
  let exists = true;

  while (exists) {
    roomCode = generateRoomCode();
    const room = await roomRepo.findByRoomCode(roomCode);
    if (!room) exists = false;
  }

  return roomCode;
};

const getAlternativeMarker = (marker) => {
  return ALLOWED_MARKERS.find((item) => item !== marker) || 'O';
};

const emitRoomUpdated = (roomCode, room) => {
  const io = getIO();
  io.to(roomCode).emit('room_updated', room);
};

const emitSessionUpdated = (roomCode, session) => {
  const io = getIO();
  io.to(roomCode).emit('session_updated', session);
};

const emitRoomStarted = (roomCode, payload) => {
  const io = getIO();
  io.to(roomCode).emit('room_started', payload);
};

const normalizeReplayRequests = (room) => {
  if (!Array.isArray(room.replayRequests)) {
    room.replayRequests = [];
  }
};

const createOnlineSessionFromRoom = async (room) => {
  const players = room.players || [];

  if (players.length < 2) {
    throw buildError('Need 2 players to create a session', 400);
  }

  const [player1, player2] = players;

  const sessionCount = await sessionRepo.countByRoomId(room._id);

  const session = await sessionRepo.create({
    roomId: room._id,
    roomCode: room.roomCode,
    sessionNumber: sessionCount + 1,
    player1Id: player1.userId,
    player2Id: player2.userId,
    player1Marker: player1.mark,
    player2Marker: player2.mark,
    boardSize: room.boardSize,
    gameType: 'ONLINE',
    board: createBoard(room.boardSize),
    currentTurn: room.hostMarker,
    status: 'PLAYING',
    winner: null,
    moves: [],
    result: null,
    startTime: new Date(),
    endTime: null
  });

  return session;
};

const createRoom = async ({ userId, gameMode, marker, boardSize, aiLevel, req }) => {
  if (gameMode === 'SINGLE') {
    const botMarker = getAlternativeMarker(marker);

    const session = await sessionRepo.create({
      roomId: null,
      roomCode: null,
      sessionNumber: 1,
      player1Id: userId,
      player2Id: null,
      player1Marker: marker,
      player2Marker: botMarker,
      aiLevel,
      boardSize,
      gameType: 'SINGLE',
      board: createBoard(boardSize),
      currentTurn: marker,
      status: 'PLAYING',
      winner: null,
      moves: [],
      result: null,
      startTime: new Date(),
      endTime: null
    });

    return {
      message: 'Single game created successfully',
      data: session
    };
  }

  if (gameMode === 'LOCAL') {
    const secondMarker = getAlternativeMarker(marker);

    const session = await sessionRepo.create({
      roomId: null,
      roomCode: null,
      sessionNumber: 1,
      player1Id: userId,
      player2Id: null,
      player1Marker: marker,
      player2Marker: secondMarker,
      boardSize,
      gameType: 'LOCAL',
      board: createBoard(boardSize),
      currentTurn: marker,
      status: 'PLAYING',
      winner: null,
      moves: [],
      result: null,
      startTime: new Date(),
      endTime: null
    });

    return {
      message: 'Local game created successfully',
      data: session
    };
  }

  const roomCode = await generateUniqueRoomCode();

  const room = await roomRepo.create({
    roomCode,
    hostId: userId,
    players: [
      {
        userId,
        mark: marker,
        connected: true
      }
    ],
    boardSize,
    hostMarker: marker,
    status: 'WAITING',
    currentSessionId: null,
    replayRequests: [],
    chat: [],
    startedAt: null,
    closedAt: null
  });

  return {
    message: 'Room created successfully',
    data: {
      room,
      shareLink: `${req.protocol}://${req.get('host')}/room/${roomCode}`
    }
  };
};

const joinRoom = async ({ userId, roomCode, marker }) => {
  const room = await roomRepo.findByRoomCode(roomCode);

  if (!room) {
    throw buildError('Room not found', 404);
  }

  if (room.status === 'CLOSED') {
    throw buildError('Room is closed', 400);
  }

  const alreadyInRoom = room.players.some(
    (player) => String(player.userId) === String(userId)
  );

  if (alreadyInRoom) {
    return {
      message: 'You are already in this room',
      data: room,
    };
  }

  if ((room.players || []).length >= 2) {
    throw buildError('Room is full', 400);
  }

  const usedMarkers = room.players.map((player) => player.mark);

  if (usedMarkers.includes(marker)) {
    throw buildError('This marker has already been chosen', 400);
  }

  room.players.push({
    userId,
    mark: marker,
    connected: true,
  });

  if (room.players.length === 2 && room.status === 'WAITING') {
    room.status = 'READY';
  }

  await roomRepo.save(room);

  emitRoomUpdated(roomCode, room);

  return {
    message: 'Joined room successfully',
    data: room,
  };
};

const startRoom = async ({ userId, roomCode }) => {
  const room = await roomRepo.findByRoomCode(roomCode);

  if (!room) {
    throw buildError('Room not found', 404);
  }

  if ((room.players || []).length < 2) {
    throw buildError('Need 2 players to start', 400);
  }

  if (String(userId) !== String(room.hostId)) {
    throw buildError('Only host can start the game', 403);
  }

  if (room.status === 'CLOSED') {
    throw buildError('Room is closed', 400);
  }

  if (room.currentSessionId) {
    const currentSession = await sessionRepo.findById(room.currentSessionId);

    if (currentSession && !currentSession.endTime) {
      throw buildError('Room already has an active session', 400);
    }
  }

  const session = await createOnlineSessionFromRoom(room);

  room.currentSessionId = session._id;
  room.status = 'PLAYING';
  room.startedAt = room.startedAt || new Date();
  room.replayRequests = [];

  await roomRepo.save(room);

  emitRoomStarted(roomCode, { room, session });
  emitSessionUpdated(roomCode, session);
  emitRoomUpdated(roomCode, room);

  return {
    message: 'Game started',
    data: {
      room,
      session
    }
  };
};

const makeMove = async ({ sessionId, row, col, marker }) => {
  const session = await sessionRepo.findById(sessionId);

  if (!session) {
    throw buildError('Session not found', 404);
  }

  if (!session.board) {
    throw buildError('Board has not been initialized', 400);
  }

  if (['WIN', 'DRAW', 'FINISHED'].includes(session.status)) {
    throw buildError('Game already finished', 400);
  }

  if (session.currentTurn !== marker) {
    throw buildError('Not your turn', 400);
  }

  const nextBoard = session.board.map((boardRow) => [...boardRow]);

  placeMarker(nextBoard, Number(row), Number(col), marker);

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

  await sessionRepo.save(session);

  if (session.roomId) {
    const room = await roomRepo.findById(session.roomId);

    if (room) {
      if (session.endTime) {
        room.status = 'FINISHED';
        room.replayRequests = [];
        await roomRepo.save(room);
        emitRoomUpdated(room.roomCode, room);
      }

      emitSessionUpdated(room.roomCode, session);
    }
  }

  return {
    message: 'Move played successfully',
    data: session
  };
};

const getRoom = async (roomCode) => {
  const room = await roomRepo.findByRoomCodeWithPlayers(roomCode);

  if (!room) {
    throw buildError('Room not found', 404);
  }

  return room;
};

const getSessionByRoom = async (roomCode) => {
  const room = await roomRepo.findByRoomCode(roomCode);

  if (!room) {
    throw buildError('Room not found', 404);
  }

  if (!room.currentSessionId) {
    throw buildError('Session not found', 404);
  }

  const session = await sessionRepo.findById(room.currentSessionId);

  if (!session) {
    throw buildError('Session not found', 404);
  }

  return session;
};

const playAgain = async ({ userId, roomCode }) => {
  const room = await roomRepo.findByRoomCode(roomCode);

  if (!room) {
    throw buildError('Room not found', 404);
  }

  if (room.status === 'CLOSED') {
    throw buildError('Room is closed', 400);
  }

  if ((room.players || []).length < 2) {
    throw buildError('Need 2 players to play again', 400);
  }

  const isInRoom = room.players.some(
    (player) => String(player.userId) === String(userId)
  );

  if (!isInRoom) {
    throw buildError('You are not in this room', 403);
  }

  if (!room.currentSessionId) {
    throw buildError('No previous session found', 400);
  }

  const currentSession = await sessionRepo.findById(room.currentSessionId);

  if (!currentSession) {
    throw buildError('Current session not found', 404);
  }

  if (!currentSession.endTime) {
    throw buildError('Current session is still playing', 400);
  }

  normalizeReplayRequests(room);

  const alreadyRequested = room.replayRequests.some(
    (requestUserId) => String(requestUserId) === String(userId)
  );

  if (!alreadyRequested) {
    room.replayRequests.push(userId);
    await roomRepo.save(room);
  }

  const uniqueReplayRequestIds = [...new Set(room.replayRequests.map(String))];

  if (uniqueReplayRequestIds.length < 2) {
    emitRoomUpdated(room.roomCode, room);

    return {
      message: 'Replay request recorded. Waiting for the other player.',
      data: {
        room,
        waitingForOtherPlayer: true
      }
    };
  }

  const session = await createOnlineSessionFromRoom(room);

  room.currentSessionId = session._id;
  room.status = 'PLAYING';
  room.replayRequests = [];
  await roomRepo.save(room);

  emitRoomStarted(room.roomCode, { room, session, replay: true });
  emitSessionUpdated(room.roomCode, session);
  emitRoomUpdated(room.roomCode, room);

  return {
    message: 'New session created successfully',
    data: {
      room,
      session,
      waitingForOtherPlayer: false
    }
  };
};

module.exports = {
  createRoom,
  joinRoom,
  startRoom,
  makeMove,
  getRoom,
  getSessionByRoom,
  playAgain
};