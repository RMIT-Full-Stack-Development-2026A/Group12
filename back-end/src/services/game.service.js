const { getIO } = require('../socket');
const { createBoard, placeMarker, getGameStatus } = require('../utils/board');
const { ALLOWED_MARKERS, MARKER_COLORS } = require('../constants/enums');
const roomRepo = require('../repositories/gameRoom.repository');
const sessionRepo = require('../repositories/gameSession.repository');
const authRepository = require('../repositories/authRepository');
const { generateRoomCode } = require('../utils/roomCode');
const TURN_TIMEOUT_MS = 60 * 1000; 


const activeTurnTimers = new Map();
const buildError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const MAX_ROOM_CODE_RETRIES = 20;

const generateUniqueRoomCode = async () => {
  for (let i = 0; i < MAX_ROOM_CODE_RETRIES; i++) {
    const roomCode = generateRoomCode();
    const room = await roomRepo.findByRoomCode(roomCode);
    if (!room) return roomCode;
  }
  throw buildError('Could not generate a unique room code, please try again', 503);
};

const getAlternativeMarker = (marker) => {
  return ALLOWED_MARKERS.find((item) => item !== marker) || 'O';
};

const getDefaultMarkerColor = (index = 0) => MARKER_COLORS[index] || '#000000';

const normalizeMarkerColor = (value, fallbackIndex = 0) => {
  const normalized = String(value || '').trim();
  if (MARKER_COLORS.includes(normalized)) {
    return normalized;
  }
  return getDefaultMarkerColor(fallbackIndex);
};

const isValidBoard = (board) => (
  Array.isArray(board)
  && board.length > 0
  && board.every((row) => Array.isArray(row) && row.length === board.length)
);

const candidateCells = (board, radius = 2) => {
  if (!isValidBoard(board)) {
    return [];
  }

  const size = board.length;
  const occupied = [];

  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell) {
        occupied.push({ rowIndex, colIndex });
      }
    });
  });

  if (occupied.length === 0) {
    const center = Math.floor(size / 2);
    return [{ rowIndex: center, colIndex: center }];
  }

  const candidates = new Map();

  occupied.forEach(({ rowIndex, colIndex }) => {
    for (let row = Math.max(0, rowIndex - radius); row <= Math.min(size - 1, rowIndex + radius); row += 1) {
      for (let col = Math.max(0, colIndex - radius); col <= Math.min(size - 1, colIndex + radius); col += 1) {
        if (!board[row][col]) {
          candidates.set(`${row},${col}`, { rowIndex: row, colIndex: col });
        }
      }
    }
  });

  return [...candidates.values()];
};

const createEmptyBoardCells = (board) => {
  if (!isValidBoard(board)) {
    return [];
  }

  const cells = [];
  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (!cell) {
        cells.push({ rowIndex, colIndex });
      }
    });
  });

  return cells;
};

const getTargetLength = (board) => (board.length === 3 ? 3 : 5);

const evaluateBoardForMarker = (board, marker) => {
  const size = board.length;
  const target = getTargetLength(board);
  let score = 0;

  const scoreWindow = (getCell, offset) => {
    let markerCount = 0;
    let emptyCount = 0;
    for (let j = 0; j < target; j++) {
      const c = getCell(offset + j);
      if (c === marker) markerCount += 1;
      else if (!c) emptyCount += 1;
      else return;
    }
    if (markerCount === target) score += 1000000;
    else if (markerCount === target - 1 && emptyCount === 1) score += 100000;
    else if (markerCount === target - 2 && emptyCount === 2) score += 10000;
    else if (markerCount > 0) score += markerCount * 20;
  };

  const scoreLines = (getCell, len) => {
    if (len < target) return;
    for (let i = 0; i <= len - target; i++) scoreWindow(getCell, i);
  };

  for (let r = 0; r < size; r++) scoreLines((i) => board[r][i], size);
  for (let c = 0; c < size; c++) scoreLines((i) => board[i][c], size);

  for (let start = 0; start < size; start++) {
    const len = size - start;
    scoreLines((i) => board[start + i][i], len);
    scoreLines((i) => board[start + i][size - 1 - i], len);
  }
  for (let startCol = 1; startCol < size; startCol++) {
    const len = size - startCol;
    scoreLines((i) => board[i][startCol + i], len);
    scoreLines((i) => board[i][startCol - i], startCol + 1);
  }

  return score;
};

const getPatternInsight = (board, row, col, marker) => {
  board[row][col] = marker;

  const size = board.length;
  const target = getTargetLength(board);
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  let openLines = 0;

  directions.forEach(([dx, dy]) => {
    let count = 1;
    let openEnds = 0;

    let r = row + dx;
    let c = col + dy;
    while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === marker) {
      count += 1;
      r += dx;
      c += dy;
    }
    if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === '') {
      openEnds += 1;
    }

    r = row - dx;
    c = col - dy;
    while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === marker) {
      count += 1;
      r -= dx;
      c -= dy;
    }
    if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === '') {
      openEnds += 1;
    }

    if (count >= target - 1 && openEnds >= 1) {
      openLines += 1;
    }
  });

  const attackScore = evaluateBoardForMarker(board, marker);
  board[row][col] = '';
  return { attackScore, openLines };
};

const findWinningMove = (board, marker, cells = candidateCells(board)) => {
  for (const cell of cells) {
    board[cell.rowIndex][cell.colIndex] = marker;
    const status = getGameStatus(board, cell.rowIndex, cell.colIndex);
    board[cell.rowIndex][cell.colIndex] = '';
    if (status.status === 'WIN') return cell;
  }
  return null;
};

const scoreCandidateCell = (board, rowIndex, colIndex, botMarker, opponentMarker) => {
  const attack = getPatternInsight(board, rowIndex, colIndex, botMarker);
  const defense = getPatternInsight(board, rowIndex, colIndex, opponentMarker);

  return attack.attackScore + defense.attackScore + attack.openLines * 2000 + defense.openLines * 2500;
};

const getTopScoredCells = (board, botMarker, opponentMarker, cells = candidateCells(board), limit = cells.length) => {
  return [...cells]
    .map((cell) => ({
      ...cell,
      score: scoreCandidateCell(board, cell.rowIndex, cell.colIndex, botMarker, opponentMarker)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

const getBestScoredMove = (board, botMarker, opponentMarker, cells = candidateCells(board)) => {
  let bestScore = -Infinity;
  let bestCells = [];

  cells.forEach((cell) => {
    const score = scoreCandidateCell(board, cell.rowIndex, cell.colIndex, botMarker, opponentMarker);

    if (score > bestScore) {
      bestScore = score;
      bestCells = [cell];
    } else if (score === bestScore) {
      bestCells.push(cell);
    }
  });

  return bestCells[Math.floor(Math.random() * bestCells.length)] || cells[0] || null;
};

const evaluateHardBoard = (board, botMarker, opponentMarker) => {
  const baseScore = evaluateBoardForMarker(board, botMarker) - evaluateBoardForMarker(board, opponentMarker);
  const center = (board.length - 1) / 2;
  let centerBonus = 0;
  let flexibilityBonus = 0;

  board.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (!cell) return;

      const distance = Math.abs(rowIndex - center) + Math.abs(colIndex - center);
      const positionScore = Math.max(0, board.length - distance);

      if (cell === botMarker) {
        centerBonus += positionScore;
        flexibilityBonus += 1;
      } else if (cell === opponentMarker) {
        centerBonus -= positionScore;
        flexibilityBonus -= 1;
      }
    });
  });

  return baseScore + centerBonus * 20 + flexibilityBonus * 100;
};

const CACHE_MARKER_MAP = { '': '0', X: '1', O: '2', A: '3', B: '4', '△': '5', '○': '6' };

const minimax = (board, depth, alpha, beta, isMaximizing, botMarker, opponentMarker, options = {}) => {
  const { deadline, maxCandidates = 20, cache = new Map() } = options;

  if (deadline && Date.now() >= deadline) {
    return {
      score: evaluateHardBoard(board, botMarker, opponentMarker),
      cell: null,
      timedOut: true
    };
  }

  const cacheKey = `${isMaximizing ? 1 : 0}${depth}${
    board.map((row) => row.map((c) => CACHE_MARKER_MAP[c] ?? '0').join('')).join('')
  }`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const cells = getTopScoredCells(board, botMarker, opponentMarker, candidateCells(board, 2), maxCandidates);
  const botWinningMove = findWinningMove(board, botMarker, cells);
  if (botWinningMove) {
    return { score: 10000000 + depth * 1000, cell: botWinningMove, timedOut: false };
  }

  const opponentWinningMove = findWinningMove(board, opponentMarker, cells);
  if (opponentWinningMove) {
    return { score: -10000000 - depth * 1000, cell: opponentWinningMove, timedOut: false };
  }

  if (depth === 0 || cells.length === 0) {
    const leaf = {
      score: evaluateHardBoard(board, botMarker, opponentMarker),
      cell: null,
      timedOut: false
    };
    cache.set(cacheKey, leaf);
    return leaf;
  }

  let bestCell = null;

  if (isMaximizing) {
    let bestScore = -Infinity;
    let timedOut = false;
    for (const cell of cells) {
      board[cell.rowIndex][cell.colIndex] = botMarker;
      const result = minimax(board, depth - 1, alpha, beta, false, botMarker, opponentMarker, options);
      board[cell.rowIndex][cell.colIndex] = '';
      timedOut = timedOut || Boolean(result.timedOut);
      if (result.score > bestScore) {
        bestScore = result.score;
        bestCell = cell;
      }
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break;
    }

    const maxResult = { score: bestScore, cell: bestCell, timedOut };
    cache.set(cacheKey, maxResult);
    return maxResult;
  }

  let bestScore = Infinity;
  let timedOut = false;
  for (const cell of cells) {
    board[cell.rowIndex][cell.colIndex] = opponentMarker;
    const result = minimax(board, depth - 1, alpha, beta, true, botMarker, opponentMarker, options);
    board[cell.rowIndex][cell.colIndex] = '';
    timedOut = timedOut || Boolean(result.timedOut);
    if (result.score < bestScore) {
      bestScore = result.score;
      bestCell = cell;
    }
    beta = Math.min(beta, bestScore);
    if (beta <= alpha) break;
  }

  const minResult = { score: bestScore, cell: bestCell, timedOut };
  cache.set(cacheKey, minResult);
  return minResult;
};

const findForkMove = (board, marker, cells = candidateCells(board, 2)) => {
  for (const cell of cells) {
    board[cell.rowIndex][cell.colIndex] = marker;
    const nextCandidates = candidateCells(board, 2);
    let winningThreats = 0;

    for (const nextCell of nextCandidates) {
      board[nextCell.rowIndex][nextCell.colIndex] = marker;
      const status = getGameStatus(board, nextCell.rowIndex, nextCell.colIndex);
      board[nextCell.rowIndex][nextCell.colIndex] = '';
      if (status.status === 'WIN' && ++winningThreats >= 2) {
        board[cell.rowIndex][cell.colIndex] = '';
        return cell;
      }
    }

    board[cell.rowIndex][cell.colIndex] = '';
  }

  return null;
};

const pickRandomCell = (cells = []) => cells[Math.floor(Math.random() * cells.length)] || null;

const chooseEasyMove = (session, cells) => {
  const board = session.board;
  const botMarker = session.player2Marker;

  const winningMove = findWinningMove(board, botMarker, cells);
  if (winningMove && Math.random() < 0.7) {
    return winningMove;
  }

  if ((session.moves || []).length === 0 && board.length === 3) {
    const corners = [
      { rowIndex: 0, colIndex: 0 },
      { rowIndex: 0, colIndex: 2 },
      { rowIndex: 2, colIndex: 0 },
      { rowIndex: 2, colIndex: 2 }
    ];
    const corner = corners.find((cell) => cells.some((candidate) => candidate.rowIndex === cell.rowIndex && candidate.colIndex === cell.colIndex));
    if (corner) {
      return corner;
    }
  }

  const localCandidates = candidateCells(board, 1);
  if (localCandidates.length > 0 && Math.random() < 0.7) {
    return pickRandomCell(localCandidates);
  }

  return pickRandomCell(cells);
};

const chooseMediumMove = (session, cells) => {
  const board = session.board;
  const botMarker = session.player2Marker;
  const opponentMarker = session.player1Marker;

  const winningMove = findWinningMove(board, botMarker, cells);
  if (winningMove) {
    return winningMove;
  }

  const blockingMove = findWinningMove(board, opponentMarker, cells);
  if (blockingMove) {
    return blockingMove;
  }

  const forkAttackMove = findForkMove(board, botMarker, cells);
  if (forkAttackMove) {
    return forkAttackMove;
  }

  const forkBlockMove = findForkMove(board, opponentMarker, cells);
  if (forkBlockMove) {
    return forkBlockMove;
  }

  const scored = getTopScoredCells(board, botMarker, opponentMarker, cells);
  if (!scored.length) {
    return pickRandomCell(cells);
  }

  const bestScore = scored[0].score;
  const bestCells = scored.filter((cell) => cell.score === bestScore);
  return pickRandomCell(bestCells);
};

const chooseHardMove = (session, cells) => {
  const board = session.board;
  const boardSize = board.length;
  const botMarker = session.player2Marker;
  const opponentMarker = session.player1Marker;

  const openingCenterMap = {
    3: [1, 1],
    10: [4, 4],
    15: [7, 7]
  };

  const openingCenter = openingCenterMap[boardSize];
  const movesCount = (session.moves || []).length;

  if (openingCenter && movesCount === 0) {
    const [centerRow, centerCol] = openingCenter;
    const centerCell = cells.find((cell) => cell.rowIndex === centerRow && cell.colIndex === centerCol);
    if (centerCell) {
      return centerCell;
    }
  }

  const winningMove = findWinningMove(board, botMarker, cells);
  if (winningMove) {
    return winningMove;
  }

  const blockingMove = findWinningMove(board, opponentMarker, cells);
  if (blockingMove) {
    return blockingMove;
  }

  const forkAttackMove = findForkMove(board, botMarker, cells);
  if (forkAttackMove) {
    return forkAttackMove;
  }

  const forkBlockMove = findForkMove(board, opponentMarker, cells);
  if (forkBlockMove) {
    return forkBlockMove;
  }

  const depthMax = boardSize === 3 ? 9 : boardSize === 10 ? 6 : 5;
  const maxCandidates = boardSize === 3 ? 9 : boardSize === 10 ? 20 : 15;
  const deadline = Date.now() + 1900;
  const cache = new Map();

  let bestCell = getBestScoredMove(board, botMarker, opponentMarker, cells);

  for (let depth = 1; depth <= depthMax; depth += 1) {
    const searchResult = minimax(
      board,
      depth,
      -Infinity,
      Infinity,
      true,
      botMarker,
      opponentMarker,
      {
        deadline,
        maxCandidates,
        cache
      }
    );

    if (searchResult.cell) {
      bestCell = searchResult.cell;
    }

    if (searchResult.timedOut || Date.now() >= deadline) {
      break;
    }
  }

  return bestCell;
};

const chooseBotMove = (session) => {
  const board = session.board || [];
  const botMarker = session.player2Marker;
  const cells = candidateCells(board, 2);

  if (!isValidBoard(board) || !botMarker) {
    return null;
  }

  if (!cells.length) {
    return null;
  }

  if (session.aiLevel === 'easy') {
    return chooseEasyMove(session, cells);
  }

  if (session.aiLevel === 'medium') {
    return chooseMediumMove(session, cells);
  }

  return chooseHardMove(session, cells);
};

const applyBotMoveToSession = async (session) => {
  if (!session || session.gameType !== 'SINGLE' || session.status !== 'PLAYING') {
    return session;
  }

  if (session.currentTurn !== session.player2Marker || !session.player2Marker) {
    return session;
  }

  const botMove = chooseBotMove(session);
  if (!botMove) {
    return session;
  }

  const nextBoard = session.board.map((row) => [...row]);
  const fallbackMove = createEmptyBoardCells(nextBoard)[0] || null;
  const normalizedMove = (
    botMove
    && Number.isInteger(botMove.rowIndex)
    && Number.isInteger(botMove.colIndex)
    && botMove.rowIndex >= 0
    && botMove.colIndex >= 0
    && botMove.rowIndex < nextBoard.length
    && botMove.colIndex < nextBoard.length
    && !nextBoard[botMove.rowIndex][botMove.colIndex]
  )
    ? botMove
    : fallbackMove;

  if (!normalizedMove) {
    return session;
  }

  placeMarker(nextBoard, normalizedMove.rowIndex, normalizedMove.colIndex, session.player2Marker);

  session.board = nextBoard;
  session.moves = [
    ...session.moves,
    {
      moveNumber: session.moves.length + 1,
      player: session.player2Marker,
      position: `${normalizedMove.rowIndex},${normalizedMove.colIndex}`,
      timestamp: new Date()
    }
  ];

  const gameStatus = getGameStatus(nextBoard, normalizedMove.rowIndex, normalizedMove.colIndex);

  if (gameStatus.status === 'WIN') {
    session.status = 'WIN';
    session.winner = gameStatus.winner;
    session.result = 'PLAYER2_WIN';
    session.endTime = new Date();
  } else if (gameStatus.status === 'DRAW') {
    session.status = 'DRAW';
    session.winner = null;
    session.result = 'DRAW';
    session.endTime = new Date();
  } else {
    session.status = 'PLAYING';
    session.currentTurn = session.player1Marker;
  }

  // Re-fetch to guard against concurrent abort (grace-period cleanup race)
  const freshSession = await sessionRepo.findById(session._id);
  if (!freshSession || freshSession.status === 'FINISHED') return session;

  await sessionRepo.save(session);

  return session;
};

const emitRoomUpdated = (roomCode, room) => {
  const io = getIO();
  io.to(roomCode).emit('room_updated', room);
};

const emitSessionUpdated = (roomCode, session) => {
  const io = getIO();
  io.to(roomCode).emit('session_updated', session);
};

const emitSessionUpdatedById = (sessionId, session) => {
  const io = getIO();
  io.to(`session:${sessionId}`).emit('session_updated', session);
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

const createOnlineSessionFromRoom = async (room, starterMarker = null) => {
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
    currentTurn: starterMarker || room.hostMarker,
    status: 'PLAYING',
    winner: null,
    moves: [],
    result: null,
    startTime: new Date(),
    endTime: null
  });

  return session;
};

const createRoom = async ({ userId, gameMode, marker, boardSize, aiLevel, starterMarker, req }) => {
  if (gameMode === 'SINGLE') {
    const botMarker = getAlternativeMarker(marker);
    const normalizedStarterMarker = ALLOWED_MARKERS.includes(String(starterMarker || '').trim())
      ? String(starterMarker || '').trim()
      : marker;

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
      currentTurn: normalizedStarterMarker,
      status: 'PLAYING',
      winner: null,
      moves: [],
      result: null,
      startTime: new Date(),
      endTime: null
    });
    resetTurnTimer(session);
    if (session.currentTurn === session.player2Marker) {
      await applyBotMoveToSession(session);
    }

    return {
      message: 'Single game created successfully',
      data: session
    };
  }

  if (gameMode === 'LOCAL') {
    const secondMarker = getAlternativeMarker(marker);
    const normalizedStarterMarker = ALLOWED_MARKERS.includes(String(starterMarker || '').trim())
      ? String(starterMarker || '').trim()
      : marker;

    if (normalizedStarterMarker !== marker && normalizedStarterMarker !== secondMarker) {
      throw buildError('Starter marker must belong to Player 1 or Player 2', 400);
    }

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
      currentTurn: normalizedStarterMarker,
      status: 'PLAYING',
      winner: null,
      moves: [],
      result: null,
      startTime: new Date(),
      endTime: null,
    });
    resetTurnTimer(session);
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
        displayMarker: marker,
        markerColor: getDefaultMarkerColor(0),
        connected: true
      }
    ],
    boardSize,
    hostMarker: marker,
    status: 'WAITING',
    currentSessionId: null,
    replayRequests: [],
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

const joinRoom = async ({ userId, roomCode, marker, markerColor }) => {
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
    const populatedRoom = await roomRepo.findByRoomCodeWithPlayers(roomCode);
    return {
      message: 'You are already in this room',
      data: populatedRoom,
    };
  }

  if ((room.players || []).length >= 2) {
    throw buildError('Room is full', 400);
  }

  const internalMarker = getAlternativeMarker(room.players[0]?.mark || marker);
  const displayMarker = marker;
  const resolvedMarkerColor = normalizeMarkerColor(markerColor, 1);

  // If player 2 chooses the same marker as the host, they must use a different color
  const hostDisplayMarker = room.players[0]?.displayMarker;
  const hostMarkerColor = room.players[0]?.markerColor;
  if (String(displayMarker).trim() === String(hostDisplayMarker).trim() && 
      String(resolvedMarkerColor) === String(hostMarkerColor)) {
    throw buildError('You must select a different marker color from the host.', 400);
  }

  room.players.push({
    userId,
    mark: internalMarker,
    displayMarker,
    markerColor: resolvedMarkerColor,
    connected: true,
  });

  if (room.players.length === 2 && room.status === 'WAITING') {
    room.status = 'READY';
  }

  await roomRepo.save(room);

  const populatedRoom = await roomRepo.findByRoomCodeWithPlayers(roomCode);
  emitRoomUpdated(roomCode, populatedRoom.toObject());

  return {
    message: 'Joined room successfully',
    data: populatedRoom,
  };
};

const startRoom = async ({ userId, roomCode, starterMarker }) => {
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

  const hostMarker = room.players[0]?.mark;
  const guestMarker = room.players[1]?.mark;
  const requestedStarterMarker = String(starterMarker || '').trim();
  const allowedStarterMarkers = [hostMarker, guestMarker].filter(Boolean);

  if (requestedStarterMarker && !allowedStarterMarkers.includes(requestedStarterMarker)) {
    throw buildError('Starter marker must belong to host or guest', 400);
  }

  const startStarterMarker = requestedStarterMarker || hostMarker;
  const session = await createOnlineSessionFromRoom(room, startStarterMarker);

  resetTurnTimer(session);
  room.currentSessionId = session._id;
  room.currentTurn = startStarterMarker;
  room.status = 'PLAYING';
  room.startedAt = room.startedAt || new Date();
  room.replayRequests = [];

  await roomRepo.save(room);

  const populatedRoomAfterStart = await roomRepo.findByRoomCodeWithPlayers(roomCode);
  const populatedRoomObj = populatedRoomAfterStart.toObject();
  emitRoomStarted(roomCode, { room: populatedRoomObj, session });
  emitSessionUpdated(roomCode, session);
  emitRoomUpdated(roomCode, populatedRoomObj);

  return {
    message: 'Game started',
    data: {
      room: populatedRoomObj,
      session
    }
  };
};

const makeMove = async ({ sessionId, row, col, marker }) => {
  let session = await sessionRepo.findById(sessionId);

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
    clearTurnTimer(session);
  } else if (gameStatus.status === 'DRAW') {
    session.status = 'DRAW';
    session.winner = null;
    session.result = 'DRAW';
    session.endTime = new Date();
    clearTurnTimer(session);
  } else {
    session.status = 'PLAYING';
    session.currentTurn =
      marker === session.player1Marker
        ? session.player2Marker || session.player1Marker
        : session.player1Marker;
  }

  await sessionRepo.save(session);

  resetTurnTimer(session);
  
  if (session.roomId) {
    const room = await roomRepo.findById(session.roomId);

    if (room) {
      if (session.endTime) {
        room.status = 'FINISHED';
        room.replayRequests = [];
        await roomRepo.save(room);
        const populatedRoomOnEnd = await roomRepo.findByRoomCodeWithPlayers(room.roomCode);
        emitRoomUpdated(room.roomCode, populatedRoomOnEnd.toObject());
      }

      emitSessionUpdated(room.roomCode, session);
    }
  }

  if (session.gameType === 'SINGLE') {
    const sessionIdForChannel = String(session._id);
    emitSessionUpdatedById(sessionIdForChannel, session);

    if (session.status === 'PLAYING' && session.currentTurn === session.player2Marker) {
      setImmediate(async () => {
        try {
          const updatedSession = await applyBotMoveToSession(session);
          emitSessionUpdatedById(sessionIdForChannel, updatedSession);
        } catch (err) {
          console.error('[makeMove] async AI move failed:', err);
        }
      });
    }
  }

  return {
    message: 'Move played successfully',
    data: session
  };
};

const getSessionById = async (sessionId, requestingUserId) => {
  const session = await sessionRepo.findById(sessionId);
  if (!session) throw buildError('Session not found', 404);

  const p1 = String(session.player1Id || '');
  const p2 = String(session.player2Id || '');
  const uid = String(requestingUserId);
  if (uid !== p1 && uid !== p2) throw buildError('Forbidden', 403);

  return session;
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

const playAgain = async ({ userId, roomCode, starterMarker }) => {
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
    const populatedRoomActive = await roomRepo.findByRoomCodeWithPlayers(room.roomCode);
    return {
      message: 'Game already restarted',
      data: {
        room: populatedRoomActive,
        session: currentSession,
        waitingForOtherPlayer: false
      }
    };
  }

  const session = await createOnlineSessionFromRoom(room, starterMarker);

  resetTurnTimer(session);
  room.currentSessionId = session._id;
  room.status = 'PLAYING';
  room.replayRequests = [];
  await roomRepo.save(room);

  const populatedRoomReplay = await roomRepo.findByRoomCodeWithPlayers(room.roomCode);
  const populatedRoomReplayObj = populatedRoomReplay.toObject();
  emitRoomStarted(room.roomCode, { room: populatedRoomReplayObj, session, replay: true });
  emitSessionUpdated(room.roomCode, session);
  emitRoomUpdated(room.roomCode, populatedRoomReplayObj);

  return {
    message: 'New session created successfully',
    data: {
      room: populatedRoomReplayObj,
      session,
      waitingForOtherPlayer: false
    }
  };
};

const listWaitingRooms = async () => {
  const rooms = await roomRepo.findWaitingRooms();
  return rooms.map((room) => ({
    roomCode: room.roomCode,
    boardSize: room.boardSize,
    hostMarker: room.hostMarker,
    hostUsername: room.players?.[0]?.userId?.username || 'Unknown',
    createdAt: room.createdAt,
    roomType: 'WAITING',
    status: room.status,
  }));
};

const listArenaRooms = async () => {
  return listWaitingRooms();
};

const listMyDuelingEntries = async (userId) => {
  const [onlineRooms, soloSessions] = await Promise.all([
    roomRepo.findActiveByUserId(userId),
    sessionRepo.findActiveSoloByUserId(userId),
  ]);

  const onlineEntries = onlineRooms.map((room) => {
    const hostPlayer = room.players?.[0];
    const guestPlayer = room.players?.[1];
    const isHost = String(hostPlayer?.userId?._id || hostPlayer?.userId) === String(userId);
    const opponentPlayer = isHost ? guestPlayer : hostPlayer;
    return {
      kind: 'ONLINE',
      roomCode: room.roomCode,
      sessionId: room.currentSessionId ? String(room.currentSessionId._id || room.currentSessionId) : null,
      status: room.status,
      boardSize: room.boardSize,
      hostMarker: room.hostMarker,
      isHost,
      opponentUsername: opponentPlayer?.userId?.username || null,
      lastActivity: room.updatedAt,
    };
  });

  const soloEntries = soloSessions.map((session) => ({
    kind: session.gameType,
    sessionId: String(session._id),
    boardSize: session.boardSize,
    status: session.status,
    aiLevel: session.aiLevel || null,
    currentTurn: session.currentTurn,
    lastActivity: session.updatedAt,
  }));

  return [...onlineEntries, ...soloEntries].sort(
    (a, b) => new Date(b.lastActivity) - new Date(a.lastActivity)
  );
};

const cleanupExpiredWaitingRooms = async () => {
  return roomRepo.deleteExpiredWaitingRooms();
};

const cleanupStaleDuelingRooms = async () => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  // Abort stale ONLINE sessions and close their rooms
  const staleSessions = await sessionRepo.findStalePlayingSessions(twoHoursAgo);
  let count = 0;
  for (const session of staleSessions) {
    await sessionRepo.abortSession(session._id);
    if (session.roomId) {
      await roomRepo.updateById(session.roomId, {
        status: 'CLOSED',
        currentSessionId: null,
        closedAt: new Date()
      });
    }
    count += 1;
  }

  // Abort orphan SINGLE/LOCAL sessions (no roomId, still PLAYING/WAITING after 2h)
  const orphanSessions = await sessionRepo.findStaleOrphanSessions(twoHoursAgo);
  for (const session of orphanSessions) {
    await sessionRepo.abortSession(session._id);
    count += 1;
  }

  return { closedDuelingRooms: count };
};

// In-memory grace-period timers (cleared on server restart; stale cleanup is the fallback)
const roomCleanupTimers = new Map();    // roomCode → timeoutId
const sessionCleanupTimers = new Map(); // sessionId (string) → timeoutId

const CLEANUP_GRACE_MS = 30_000;

const _performRoomCleanup = async (roomCode) => {
  roomCleanupTimers.delete(roomCode);
  const io = getIO();
  // Re-check: if someone rejoined during grace period, skip
  const currentSize = io.sockets.adapter.rooms.get(roomCode)?.size || 0;
  if (currentSize > 0) return;

  const room = await roomRepo.findByRoomCode(roomCode);
  if (!room || ['CLOSED', 'FINISHED'].includes(room.status)) return;

  if (room.status === 'PLAYING' && room.currentSessionId) {
    await sessionRepo.abortSession(room.currentSessionId);
  }

  io.to(roomCode).emit('room_closed', { roomCode, message: 'All players have left the room.' });
  await roomRepo.deleteByRoomCode(roomCode);
};

const scheduleRoomCleanup = (roomCode) => {
  if (roomCleanupTimers.has(roomCode)) return;
  const id = setTimeout(() => _performRoomCleanup(roomCode).catch(console.error), CLEANUP_GRACE_MS);
  roomCleanupTimers.set(roomCode, id);
};

const cancelRoomCleanup = (roomCode) => {
  const id = roomCleanupTimers.get(roomCode);
  if (id !== undefined) {
    clearTimeout(id);
    roomCleanupTimers.delete(roomCode);
  }
};

const _performSessionCleanup = async (sessionId) => {
  sessionCleanupTimers.delete(sessionId);
  const io = getIO();
  const channelKey = `session:${sessionId}`;
  const currentSize = io.sockets.adapter.rooms.get(channelKey)?.size || 0;
  if (currentSize > 0) return;

  const session = await sessionRepo.findById(sessionId);
  // Only abort SINGLE/LOCAL sessions that are still active; ONLINE sessions are handled by room cleanup
  if (!session || !['SINGLE', 'LOCAL'].includes(session.gameType)) return;
  if (!['WAITING', 'PLAYING'].includes(session.status)) return;

  await sessionRepo.abortSession(sessionId);
};

const scheduleSessionCleanup = (sessionId) => {
  const key = String(sessionId);
  if (sessionCleanupTimers.has(key)) return;
  const id = setTimeout(() => _performSessionCleanup(key).catch(console.error), CLEANUP_GRACE_MS);
  sessionCleanupTimers.set(key, id);
};

const cancelSessionCleanup = (sessionId) => {
  const key = String(sessionId);
  const id = sessionCleanupTimers.get(key);
  if (id !== undefined) {
    clearTimeout(id);
    sessionCleanupTimers.delete(key);
  }
};

// Legacy: kept for backward compat (server.js may reference it)
const closeRoomOnAllDisconnected = (roomCode) => scheduleRoomCleanup(roomCode);

const closeRoom = async (roomCode, userId) => {
  const room = await roomRepo.findByRoomCode(roomCode);

  if (!room) {
    throw buildError('Room not found', 404);
  }

  if (String(room.hostId) !== String(userId)) {
    throw buildError('Only host can close the room', 403);
  }

  if (room.status === 'PLAYING') {
    throw buildError('Cannot close room while game is in progress. Surrender first.', 400);
  }

  room.status = 'CLOSED';
  room.closedAt = new Date();
  await roomRepo.save(room);

  const io = getIO();
  io.to(roomCode).emit('room_closed', { roomCode, message: 'Host has closed the room.' });

  return room;
};
const handleTurnTimeout = async (sessionId) => {
  try {
    const session = await sessionRepo.findById(sessionId);

    if (!session || session.status !== 'PLAYING') {
      return;
    }

    const loserMarker = session.currentTurn;

    const winnerMarker =
      loserMarker === session.player1Marker
        ? session.player2Marker
        : session.player1Marker;

    session.status = 'WIN';
    session.winner = winnerMarker;

    session.result =
      winnerMarker === session.player1Marker
        ? 'PLAYER1_WIN'
        : 'PLAYER2_WIN';

    session.endTime = new Date();

    session.timeoutLose = loserMarker;

    await sessionRepo.save(session);

    if (session.roomId) {
      const room = await roomRepo.findById(session.roomId);

      if (room) {
        room.status = 'FINISHED';
        await roomRepo.save(room);

        emitSessionUpdated(room.roomCode, session);

        const populatedRoom = await roomRepo.findByRoomCodeWithPlayers(
          room.roomCode
        );

        emitRoomUpdated(room.roomCode, populatedRoom.toObject());
      }
    } else {
      emitSessionUpdatedById(String(session._id), session);
    }

    activeTurnTimers.delete(String(sessionId));
  } catch (err) {
    console.error('[TURN_TIMEOUT]', err);
  }
};

const resetTurnTimer = (session) => {
  const sessionId = String(session._id);

  const oldTimer = activeTurnTimers.get(sessionId);

  if (oldTimer) {
    clearTimeout(oldTimer);
  }

  if (session.status !== 'PLAYING') {
    activeTurnTimers.delete(sessionId);
    return;
  }

  session.turnDeadlineAt = new Date(Date.now() + TURN_TIMEOUT_MS);

  const timeout = setTimeout(() => {
    handleTurnTimeout(sessionId);
  }, TURN_TIMEOUT_MS);

  activeTurnTimers.set(sessionId, timeout);
};

const clearTurnTimer = (sessionId) => {
  const timer = activeTurnTimers.get(String(sessionId));

  if (timer) {
    clearTimeout(timer);
    activeTurnTimers.delete(String(sessionId));
  }
};

const sendChatMessage = async ({ sessionId, senderId, senderUsername, type, content }) => {
  if (!['text', 'sticker'].includes(type)) {
    throw buildError('Invalid chat type', 400);
  }
  const trimmed = String(content || '').trim();
  if (!trimmed) {
    throw buildError('Empty message', 400);
  }
  if (trimmed.length > 500) {
    throw buildError('Message too long', 400);
  }

  const session = await sessionRepo.findById(sessionId);
  if (!session) {
    throw buildError('Session not found', 404);
  }
  if (session.gameType !== 'ONLINE') {
    throw buildError('Chat is only available for ONLINE sessions', 400);
  }
  if (session.status !== 'PLAYING') {
    throw buildError('Session is not active', 400);
  }

  const participants = [
    session.player1Id ? String(session.player1Id) : null,
    session.player2Id ? String(session.player2Id) : null,
  ].filter(Boolean);
  if (!participants.includes(String(senderId))) {
    throw buildError('Not a participant of this session', 403);
  }

  // Snapshot username server-side (don't trust client) for replay consistency
  let resolvedUsername = String(senderUsername || '').trim();
  if (!resolvedUsername) {
    try {
      const user = await authRepository.findUserById(String(senderId));
      resolvedUsername = user?.username || '';
    } catch (e) {
      resolvedUsername = '';
    }
  }

  const message = {
    senderId,
    senderUsername: resolvedUsername,
    type,
    content: trimmed,
    timestamp: new Date(),
  };

  await sessionRepo.appendChatMessage(sessionId, message);

  const payload = {
    sessionId: String(sessionId),
    senderId: String(senderId),
    senderUsername: resolvedUsername,
    type: message.type,
    content: message.content,
    timestamp: message.timestamp,
  };

  const io = getIO();
  if (session.roomCode) {
    io.to(session.roomCode).emit('chat_message', payload);
  }
  io.to(`session:${sessionId}`).emit('chat_message', payload);

  return message;
};

const getChatHistory = async (sessionId) => {
  const session = await sessionRepo.findById(sessionId);
  if (!session) {
    throw buildError('Session not found', 404);
  }
  return sessionRepo.getChatHistory(sessionId);
};
module.exports = {
  createRoom,
  joinRoom,
  startRoom,
  makeMove,
  getRoom,
  getSessionById,
  getSessionByRoom,
  playAgain,
  closeRoom,
  closeRoomOnAllDisconnected,
  scheduleRoomCleanup,
  cancelRoomCleanup,
  scheduleSessionCleanup,
  cancelSessionCleanup,
  listWaitingRooms,
  listArenaRooms,
  listMyDuelingEntries,
  cleanupExpiredWaitingRooms,
  cleanupStaleDuelingRooms,
  sendChatMessage,
  getChatHistory,
};