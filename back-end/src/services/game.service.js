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

const isValidBoard = (board) => (
  Array.isArray(board)
  && board.length > 0
  && board.every((row) => Array.isArray(row) && row.length === board.length)
);

const cloneBoard = (board) => board.map((row) => [...row]);

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

const evaluateWindow = (windowCells, marker, target) => {
  const opponentCount = windowCells.filter((cell) => cell && cell !== marker).length;
  if (opponentCount > 0) {
    return 0;
  }

  const markerCount = windowCells.filter((cell) => cell === marker).length;
  const emptyCount = windowCells.filter((cell) => !cell).length;

  if (markerCount === target) return 1000000;
  if (markerCount === target - 1 && emptyCount === 1) return 100000;
  if (markerCount === target - 2 && emptyCount === 2) return 10000;
  if (markerCount > 0) return markerCount * 20;

  return 0;
};

const evaluateBoardForMarker = (board, marker) => {
  const size = board.length;
  const target = getTargetLength(board);
  let score = 0;

  const addLineScore = (cells) => {
    if (cells.length < target) {
      return;
    }

    for (let i = 0; i <= cells.length - target; i += 1) {
      score += evaluateWindow(cells.slice(i, i + target), marker, target);
    }
  };

  for (let r = 0; r < size; r += 1) {
    addLineScore(board[r]);
  }

  for (let c = 0; c < size; c += 1) {
    addLineScore(board.map((row) => row[c]));
  }

  for (let start = 0; start < size; start += 1) {
    const diag = [];
    const antiDiag = [];

    for (let row = start, col = 0; row < size && col < size; row += 1, col += 1) {
      diag.push(board[row][col]);
    }

    for (let row = start, col = size - 1; row < size && col >= 0; row += 1, col -= 1) {
      antiDiag.push(board[row][col]);
    }

    addLineScore(diag);
    addLineScore(antiDiag);
  }

  for (let startCol = 1; startCol < size; startCol += 1) {
    const diag = [];
    const antiDiag = [];

    for (let row = 0, col = startCol; row < size && col < size; row += 1, col += 1) {
      diag.push(board[row][col]);
    }

    for (let row = 0, col = startCol; row < size && col >= 0; row += 1, col -= 1) {
      antiDiag.push(board[row][col]);
    }

    addLineScore(diag);
    addLineScore(antiDiag);
  }

  return score;
};

const getPatternInsight = (board, row, col, marker) => {
  const tempBoard = cloneBoard(board);
  tempBoard[row][col] = marker;

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
    while (r >= 0 && r < size && c >= 0 && c < size && tempBoard[r][c] === marker) {
      count += 1;
      r += dx;
      c += dy;
    }
    if (r >= 0 && r < size && c >= 0 && c < size && tempBoard[r][c] === '') {
      openEnds += 1;
    }

    r = row - dx;
    c = col - dy;
    while (r >= 0 && r < size && c >= 0 && c < size && tempBoard[r][c] === marker) {
      count += 1;
      r -= dx;
      c -= dy;
    }
    if (r >= 0 && r < size && c >= 0 && c < size && tempBoard[r][c] === '') {
      openEnds += 1;
    }

    if (count >= target - 1 && openEnds >= 1) {
      openLines += 1;
    }
  });

  return {
    attackScore: evaluateBoardForMarker(tempBoard, marker),
    openLines
  };
};

const findWinningMove = (board, marker, cells = candidateCells(board)) => {
  for (const cell of cells) {
    const tempBoard = cloneBoard(board);
    tempBoard[cell.rowIndex][cell.colIndex] = marker;
    const status = getGameStatus(tempBoard, cell.rowIndex, cell.colIndex);
    if (status.status === 'WIN') {
      return cell;
    }
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

const minimax = (board, depth, alpha, beta, isMaximizing, botMarker, opponentMarker, options = {}) => {
  const { deadline, maxCandidates = 20, cache = new Map() } = options;

  if (deadline && Date.now() >= deadline) {
    return {
      score: evaluateHardBoard(board, botMarker, opponentMarker),
      cell: null,
      timedOut: true
    };
  }

  const cacheKey = `${isMaximizing ? 'MAX' : 'MIN'}|${depth}|${board.map((row) => row.join('.')).join('|')}`;
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
      const nextBoard = cloneBoard(board);
      nextBoard[cell.rowIndex][cell.colIndex] = botMarker;
      const result = minimax(nextBoard, depth - 1, alpha, beta, false, botMarker, opponentMarker, options);
      timedOut = timedOut || Boolean(result.timedOut);
      if (result.score > bestScore) {
        bestScore = result.score;
        bestCell = cell;
      }
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) {
        break;
      }
    }

    const maxResult = { score: bestScore, cell: bestCell, timedOut };
    cache.set(cacheKey, maxResult);
    return maxResult;
  }

  let bestScore = Infinity;
  let timedOut = false;
  for (const cell of cells) {
    const nextBoard = cloneBoard(board);
    nextBoard[cell.rowIndex][cell.colIndex] = opponentMarker;
    const result = minimax(nextBoard, depth - 1, alpha, beta, true, botMarker, opponentMarker, options);
    timedOut = timedOut || Boolean(result.timedOut);
    if (result.score < bestScore) {
      bestScore = result.score;
      bestCell = cell;
    }
    beta = Math.min(beta, bestScore);
    if (beta <= alpha) {
      break;
    }
  }

  const minResult = { score: bestScore, cell: bestCell, timedOut };
  cache.set(cacheKey, minResult);
  return minResult;
};

const findForkMove = (board, marker, cells = candidateCells(board, 2)) => {
  for (const cell of cells) {
    const tempBoard = cloneBoard(board);
    tempBoard[cell.rowIndex][cell.colIndex] = marker;

    const nextCandidates = candidateCells(tempBoard, 2);
    let winningThreats = 0;

    for (const nextCell of nextCandidates) {
      const nextBoard = cloneBoard(tempBoard);
      nextBoard[nextCell.rowIndex][nextCell.colIndex] = marker;
      const status = getGameStatus(nextBoard, nextCell.rowIndex, nextCell.colIndex);

      if (status.status === 'WIN') {
        winningThreats += 1;
      }

      if (winningThreats >= 2) {
        return cell;
      }
    }
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

  room.currentSessionId = session._id;
  room.currentTurn = startStarterMarker;
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

const listWaitingRooms = async () => {
  const rooms = await roomRepo.findWaitingRooms();
  return rooms.map((room) => ({
    roomCode: room.roomCode,
    boardSize: room.boardSize,
    hostMarker: room.hostMarker,
    hostUsername: room.players?.[0]?.userId?.username || 'Unknown',
    createdAt: room.createdAt,
  }));
};

module.exports = {
  createRoom,
  joinRoom,
  startRoom,
  makeMove,
  getRoom,
  getSessionByRoom,
  playAgain,
  listWaitingRooms
};