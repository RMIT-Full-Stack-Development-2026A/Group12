// const GameRoom = require('../models/gameRoom');
// const GameSession = require('../models/gameSession');
// const { getIO } = require('../socket');
// const { createBoard, placeMarker, getGameStatus } = require('../utils/board');

// // const ALLOWED_MARKERS = ['X', 'O', 'A', 'B', '△', '○'];
// // const ALLOWED_BOARD_SIZES = [3, 10, 15];
// // const ALLOWED_GAME_MODES = ['LOCAL', 'SINGLE', 'ONLINE'];
// // const ALLOWED_AI_LEVELS = ['easy', 'medium', 'hard'];

// // Move to utils file
// // const generateRoomCode = (length = 6) => {
// //   const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// //   let code = '';

// //   for (let i = 0; i < length; i++) {
// //     code += chars[Math.floor(Math.random() * chars.length)];
// //   }

// //   return code;
// // };

// // const generateUniqueRoomCode = async () => {
// //   let roomCode;
// //   let exists = true;

// //   while (exists) {
// //     roomCode = generateRoomCode();
// //     const room = await GameRoom.findOne({ roomCode });
// //     if (!room) exists = false;
// //   }

// //   return roomCode;
// // };

// const createRoomController = async (req, res) => {
//   try {
//     const userId = req.body.userId;
//     const { gameMode, marker, boardSize, aiLevel } = req.body;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: 'userId is required'
//       });
//     }

//     if (!ALLOWED_GAME_MODES.includes(gameMode)) {
//       return res.status(400).json({
//         success: false,
//         message: 'gameMode must be LOCAL, SINGLE, or ONLINE'
//       });
//     }

//     const normalizedMarker = String(marker || '').trim();
//     const normalizedBoardSize = Number(boardSize);

//     if (!ALLOWED_MARKERS.includes(normalizedMarker)) {
//       return res.status(400).json({
//         success: false,
//         message: `Marker must be one of: ${ALLOWED_MARKERS.join(', ')}`
//       });
//     }

//     if (!ALLOWED_BOARD_SIZES.includes(normalizedBoardSize)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Board size must be 3, 10, or 15'
//       });
//     }

//     if (gameMode === 'SINGLE') {
//       if (!ALLOWED_AI_LEVELS.includes(aiLevel || 'easy')) {
//         return res.status(400).json({
//           success: false,
//           message: 'aiLevel must be easy, medium, or hard'
//         });
//       }

//       const botMarker =
//         ALLOWED_MARKERS.find((item) => item !== normalizedMarker) || 'O';

//       const session = await GameSession.create({
//         player1Id: userId,
//         player2Id: null,
//         player1Marker: normalizedMarker,
//         player2Marker: botMarker,
//         aiLevel: aiLevel || 'easy',
//         boardSize: normalizedBoardSize,
//         gameType: 'SINGLE',
//         board: createBoard(normalizedBoardSize),
//         currentTurn: normalizedMarker,
//         roomCode: null,
//         status: 'PLAYING',
//         winner: null,
//         moves: [],
//         result: null,
//         startTime: new Date(),
//         endTime: null
//       });

//       return res.status(201).json({
//         success: true,
//         message: 'Single game created successfully',
//         data: session
//       });
//     }

//     if (gameMode === 'LOCAL') {
//       const secondMarker =
//         ALLOWED_MARKERS.find((item) => item !== normalizedMarker) || 'O';

//       const session = await GameSession.create({
//         player1Id: userId,
//         player2Id: null,
//         player1Marker: normalizedMarker,
//         player2Marker: secondMarker,
//         roomCode: null,
//         boardSize: normalizedBoardSize,
//         gameType: 'LOCAL',
//         board: createBoard(normalizedBoardSize),
//         currentTurn: normalizedMarker,
//         status: 'PLAYING',
//         winner: null,
//         moves: [],
//         result: null,
//         startTime: new Date(),
//         endTime: null
//       });

//       return res.status(201).json({
//         success: true,
//         message: 'Local game created successfully',
//         data: session
//       });
//     }

//     const roomCode = await generateUniqueRoomCode();

//     const room = await GameRoom.create({
//       roomCode,
//       players: [
//         {
//           userId,
//           mark: normalizedMarker,
//           connected: true
//         }
//       ],
//       boardSize: normalizedBoardSize,
//       hostMarker: normalizedMarker,
//       currentTurn: normalizedMarker,
//       status: 'WAITING',
//       chat: [],
//       startedAt: null
//     });

//     const session = await GameSession.create({
//       player1Id: userId,
//       player2Id: null,
//       player1Marker: normalizedMarker,
//       player2Marker: null,
//       roomCode: roomCode,
//       boardSize: normalizedBoardSize,
//       gameType: 'ONLINE',
//       board: createBoard(normalizedBoardSize),
//       currentTurn: normalizedMarker,
//       status: 'WAITING',
//       winner: null,
//       moves: [],
//       result: null,
//       startTime: new Date(),
//       endTime: null
//     });

//     return res.status(201).json({
//       success: true,
//       message: 'Room created successfully',
//       data: {
//         room,
//         session,
//         shareLink: `${req.protocol}://${req.get('host')}/room/${roomCode}`
//       }
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Create room failed'
//     });
//   }
// };

// const joinRoomController = async (req, res) => {
//   try {
//     const userId = req.body.userId;
//     const { roomCode } = req.params;
//     const { marker } = req.body;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: 'userId is required'
//       });
//     }

//     const normalizedMarker = String(marker || '').trim();

//     if (!ALLOWED_MARKERS.includes(normalizedMarker)) {
//       return res.status(400).json({
//         success: false,
//         message: `Marker must be one of: ${ALLOWED_MARKERS.join(', ')}`
//       });
//     }

//     const room = await GameRoom.findOne({ roomCode });

//     if (!room) {
//       return res.status(404).json({
//         success: false,
//         message: 'Room not found'
//       });
//     }

//     if (room.status === 'CLOSED') {
//       return res.status(400).json({
//         success: false,
//         message: 'Room is closed'
//       });
//     }

//     if (room.players.length >= 2) {
//       return res.status(400).json({
//         success: false,
//         message: 'Room is full'
//       });
//     }

//     const alreadyInRoom = room.players.some(
//       (player) => String(player.userId) === String(userId)
//     );

//     if (alreadyInRoom) {
//       return res.status(200).json({
//         success: true,
//         message: 'You are already in this room',
//         data: room
//       });
//     }

//     const usedMarkers = room.players.map((player) => player.mark);

//     if (usedMarkers.includes(normalizedMarker)) {
//       return res.status(400).json({
//         success: false,
//         message: 'This marker has already been chosen'
//       });
//     }

//     room.players.push({
//       userId,
//       mark: normalizedMarker,
//       connected: true
//     });

//     await room.save();

//     const session = await GameSession.findOne({
//       gameType: 'ONLINE',
//       player1Id: room.players[0].userId,
//       player2Id: null,
//       endTime: null
//     }).sort({ createdAt: -1 });

//     if (session) {
//       session.player2Id = userId;
//       session.player2Marker = normalizedMarker;
//       await session.save();
//     }

//     const io = getIO();
//     io.to(roomCode).emit('room_updated', room);

//     return res.status(200).json({
//       success: true,
//       message: 'Joined room successfully',
//       data: room
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Join room failed'
//     });
//   }
// };

// const getRoomController = async (req, res) => {
//   try {
//     const { roomCode } = req.params;

//     const room = await GameRoom.findOne({ roomCode }).populate(
//       'players.userId',
//       'username email'
//     );

//     if (!room) {
//       return res.status(404).json({
//         success: false,
//         message: 'Room not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: room
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Get room failed'
//     });
//   }
// };

// const startRoomController = async (req, res) => {
//   try {
//     const userId = req.body.userId;
//     const { roomCode } = req.params;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: 'userId is required'
//       });
//     }

//     const room = await GameRoom.findOne({ roomCode });

//     if (!room) {
//       return res.status(404).json({
//         success: false,
//         message: 'Room not found'
//       });
//     }

//     if (room.players.length < 2) {
//       return res.status(400).json({
//         success: false,
//         message: 'Need 2 players to start'
//       });
//     }

//     const hostId = String(room.players[0].userId);

//     if (String(userId) !== hostId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Only host can start the game'
//       });
//     }

//     room.status = 'PLAYING';
//     if (!room.startedAt) {
//       room.startedAt = new Date();
//     }

//     await room.save();

//     const session = await GameSession.findOne({
//       gameType: 'ONLINE',
//       player1Id: room.players[0].userId,
//       endTime: null
//     }).sort({ createdAt: -1 });

//     if (session) {
//       session.status = 'PLAYING';
//       await session.save();
//     }

//     const io = getIO();
//     io.to(roomCode).emit('room_started', room);
//     io.to(roomCode).emit('room_updated', room);

//     return res.status(200).json({
//       success: true,
//       message: 'Game started',
//       data: room
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Start game failed'
//     });
//   }
// };

// const makeMoveController = async (req, res) => {
//   try {
//     const { sessionId, row, col, marker } = req.body;

//     if (!sessionId || row === undefined || col === undefined || !marker) {
//       return res.status(400).json({
//         success: false,
//         message: 'sessionId, row, col, and marker are required'
//       });
//     }

//     const session = await GameSession.findById(sessionId);

//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: 'Session not found'
//       });
//     }

//     if (!session.board) {
//       return res.status(400).json({
//         success: false,
//         message: 'Board has not been initialized'
//       });
//     }

//     if (session.status === 'WIN' || session.status === 'DRAW' || session.status === 'FINISHED') {
//       return res.status(400).json({
//         success: false,
//         message: 'Game already finished'
//       });
//     }

//     if (session.currentTurn !== marker) {
//       return res.status(400).json({
//         success: false,
//         message: 'Not your turn'
//       });
//     }

//     const nextBoard = session.board.map((boardRow) => [...boardRow]);

//     try {
//       placeMarker(nextBoard, Number(row), Number(col), marker);
//     } catch (placeError) {
//       return res.status(400).json({
//         success: false,
//         message: placeError.message || 'Invalid move'
//       });
//     }

//     const nextMoves = [
//       ...session.moves,
//       {
//         moveNumber: session.moves.length + 1,
//         player: marker,
//         position: `${row},${col}`,
//         timestamp: new Date()
//       }
//     ];

//     const gameStatus = getGameStatus(nextBoard, Number(row), Number(col));

//     session.board = nextBoard;
//     session.moves = nextMoves;

//     if (gameStatus.status === 'WIN') {
//       session.status = 'WIN';
//       session.winner = gameStatus.winner;
//       session.result =
//         marker === session.player1Marker ? 'PLAYER1_WIN' : 'PLAYER2_WIN';
//       session.endTime = new Date();
//     } else if (gameStatus.status === 'DRAW') {
//       session.status = 'DRAW';
//       session.winner = null;
//       session.result = 'DRAW';
//       session.endTime = new Date();
//     } else {
//       session.status = 'PLAYING';
//       session.currentTurn =
//         marker === session.player1Marker
//           ? session.player2Marker || session.player1Marker
//           : session.player1Marker;
//     }

//     await session.save();

//     const io = getIO();
//      if (session.roomCode) {
//         const io = getIO();
//         io.to(session.roomCode).emit('session_updated', session);
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Move played successfully',
//       data: session
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Make move failed'
//     });
//   }
// };
// const getSessionByRoomController = async (req, res) => {
//   try {
//     const { roomCode } = req.params;

//     const session = await GameSession.findOne({
//       roomCode,
//       gameType: 'ONLINE',
//       endTime: null
//     }).sort({ createdAt: -1 });

//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: 'Session not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: session
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Get session failed'
//     });
//   }
// };
// module.exports = {
//   createRoomController,
//   joinRoomController,
//   getRoomController,
//   startRoomController,
//   makeMoveController,
//   getSessionByRoomController
// };
const GameRoom = require('../models/gameRoom');
const GameSession = require('../models/gameSession');
const User = require('../models/user');
const { getIO } = require('../socket');
const { createBoard, placeMarker, getGameStatus } = require('../utils/board');

const ALLOWED_MARKERS = ['X', 'O', 'A', 'B', '△', '○'];
const ALLOWED_BOARD_SIZES = [3, 10, 15];
const ALLOWED_GAME_MODES = ['LOCAL', 'SINGLE', 'ONLINE'];
const ALLOWED_AI_LEVELS = ['easy', 'medium', 'hard'];

const pickOtherMarker = (marker) => ALLOWED_MARKERS.find((item) => item !== marker) || 'O';

const buildPlayerIdentityMap = async (userIds = []) => {
  const uniqueIds = [...new Set(userIds.filter(Boolean).map((value) => String(value)))];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const users = await User.find({ _id: { $in: uniqueIds } }).select('username email avatarUrl').lean();

  const userMap = new Map(users.map((user) => [String(user._id), user]));

  const playerMap = new Map();

  uniqueIds.forEach((id) => {
    const user = userMap.get(id) || null;
    playerMap.set(id, {
      _id: id,
      username: user?.username || null,
      email: user?.email || null,
      avatarUrl: user?.avatarUrl || null
    });
  });

  return playerMap;
};

const enrichRoomWithUsers = async (room) => {
  if (!room) {
    return room;
  }

  const plainRoom = typeof room.toObject === 'function' ? room.toObject() : room;
  const playerIds = (plainRoom.players || []).map((player) => player.userId);
  const playerMap = await buildPlayerIdentityMap(playerIds);

  return {
    ...plainRoom,
    players: (plainRoom.players || []).map((player) => {
      const userId = String(player.userId);
      return {
        ...player,
        userId: playerMap.get(userId) || player.userId
      };
    })
  };
};

const isValidBoard = (board) => (
  Array.isArray(board)
  && board.length > 0
  && board.every((row) => Array.isArray(row) && row.length === board.length)
);

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

const shuffleArray = (values = []) => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

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
    for (let row = Math.max(0, rowIndex - radius); row <= Math.min(size - 1, rowIndex + radius); row++) {
      for (let col = Math.max(0, colIndex - radius); col <= Math.min(size - 1, colIndex + radius); col++) {
        if (!board[row][col]) {
          candidates.set(`${row},${col}`, { rowIndex: row, colIndex: col });
        }
      }
    }
  });

  return candidates.size > 0 ? [...candidates.values()] : createEmptyBoardCells(board);
};

const getTargetLength = (board) => (board.length === 3 ? 3 : 5);

const cloneBoard = (board) => board.map((row) => [...row]);

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
  if (markerCount === target - 3 && emptyCount >= 3) return 1000;
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

    for (let i = 0; i <= cells.length - target; i++) {
      const windowCells = cells.slice(i, i + target);
      score += evaluateWindow(windowCells, marker, target);
    }
  };

  for (let r = 0; r < size; r++) {
    addLineScore(board[r]);
  }

  for (let c = 0; c < size; c++) {
    addLineScore(board.map((row) => row[c]));
  }

  for (let start = 0; start < size; start++) {
    const diag = [];
    const antiDiag = [];

    for (
      let row = start, col = 0;
      row < size && col < size;
      row += 1, col += 1
    ) {
      diag.push(board[row][col]);
    }

    for (
      let row = start, col = size - 1;
      row < size && col >= 0;
      row += 1, col -= 1
    ) {
      antiDiag.push(board[row][col]);
    }

    addLineScore(diag);
    addLineScore(antiDiag);
  }

  for (let startCol = 1; startCol < size; startCol++) {
    const diag = [];
    const antiDiag = [];

    for (
      let row = 0, col = startCol;
      row < size && col < size;
      row += 1, col += 1
    ) {
      diag.push(board[row][col]);
    }

    for (
      let row = 0, col = startCol;
      row < size && col >= 0;
      row += 1, col -= 1
    ) {
      antiDiag.push(board[row][col]);
    }

    addLineScore(diag);
    addLineScore(antiDiag);
  }

  return score;
};

const getPatternInsight = (board, row, col, marker) => {
  const tempBoard = cloneBoard(board);
  placeMarker(tempBoard, row, col, marker);

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
    placeMarker(tempBoard, cell.rowIndex, cell.colIndex, marker);
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

const countOpenDirections = (board, rowIndex, colIndex, marker) => {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  let openCount = 0;

  directions.forEach(([dx, dy]) => {
    const nextRow = rowIndex + dx;
    const nextCol = colIndex + dy;
    const prevRow = rowIndex - dx;
    const prevCol = colIndex - dy;

    const nextOpen = (
      nextRow >= 0
      && nextRow < board.length
      && nextCol >= 0
      && nextCol < board.length
      && (board[nextRow][nextCol] === '' || board[nextRow][nextCol] === marker)
    );

    const prevOpen = (
      prevRow >= 0
      && prevRow < board.length
      && prevCol >= 0
      && prevCol < board.length
      && (board[prevRow][prevCol] === '' || board[prevRow][prevCol] === marker)
    );

    if (nextOpen || prevOpen) {
      openCount += 1;
    }
  });

  return openCount;
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
      const flexibilityScore = countOpenDirections(board, rowIndex, colIndex, cell);

      if (cell === botMarker) {
        centerBonus += positionScore;
        flexibilityBonus += flexibilityScore;
      } else if (cell === opponentMarker) {
        centerBonus -= positionScore;
        flexibilityBonus -= flexibilityScore;
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
      placeMarker(nextBoard, cell.rowIndex, cell.colIndex, botMarker);
      const result = minimax(
        nextBoard,
        depth - 1,
        alpha,
        beta,
        false,
        botMarker,
        opponentMarker,
        options
      );
      timedOut = timedOut || Boolean(result.timedOut);
      if (result.score > bestScore) {
        bestScore = result.score;
        bestCell = cell;
      }
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) {
        break;
      }

      if (deadline && Date.now() >= deadline) {
        timedOut = true;
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
    placeMarker(nextBoard, cell.rowIndex, cell.colIndex, opponentMarker);
    const result = minimax(
      nextBoard,
      depth - 1,
      alpha,
      beta,
      true,
      botMarker,
      opponentMarker,
      options
    );
    timedOut = timedOut || Boolean(result.timedOut);
    if (result.score < bestScore) {
      bestScore = result.score;
      bestCell = cell;
    }
    beta = Math.min(beta, bestScore);
    if (beta <= alpha) {
      break;
    }

    if (deadline && Date.now() >= deadline) {
      timedOut = true;
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
    placeMarker(tempBoard, cell.rowIndex, cell.colIndex, marker);

    const nextCandidates = candidateCells(tempBoard, 2);
    let winningThreats = 0;

    for (const nextCell of nextCandidates) {
      const nextBoard = cloneBoard(tempBoard);
      placeMarker(nextBoard, nextCell.rowIndex, nextCell.colIndex, marker);
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

const pickEasyOpening = (board, cells) => {
  if (board.length !== 3) {
    return null;
  }

  const corners = shuffleArray([
    { rowIndex: 0, colIndex: 0 },
    { rowIndex: 0, colIndex: 2 },
    { rowIndex: 2, colIndex: 0 },
    { rowIndex: 2, colIndex: 2 }
  ]);

  return corners.find((corner) => cells.some((cell) => cell.rowIndex === corner.rowIndex && cell.colIndex === corner.colIndex)) || null;
};

const chooseEasyMove = (session, cells) => {
  const board = session.board;
  const boardSize = board.length;
  const botMarker = session.player2Marker;

  const winningMove = findWinningMove(board, botMarker, cells);
  if (winningMove && Math.random() < 0.7) {
    return winningMove;
  }

  if ((session.moves || []).length === 0 && boardSize === 3) {
    const easyOpening = pickEasyOpening(board, cells);
    if (easyOpening) {
      return easyOpening;
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
  const boardSize = board.length;
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

  if ((session.moves || []).length === 0 && boardSize === 3) {
    const center = Math.floor(boardSize / 2);
    const centerCell = cells.find((cell) => cell.rowIndex === center && cell.colIndex === center);
    if (centerCell) {
      return centerCell;
    }
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

  if (openingCenter && movesCount === 1) {
    const [centerRow, centerCol] = openingCenter;
    if (!board[centerRow][centerCol]) {
      return { rowIndex: centerRow, colIndex: centerCol };
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

  try {
    placeMarker(nextBoard, normalizedMove.rowIndex, normalizedMove.colIndex, session.player2Marker);
  } catch (error) {
    return session;
  }

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

  await session.save();

  return session;
};

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
    const normalizedUserId = userId || null;
    const { gameMode, marker, boardSize, aiLevel, player2Marker, starterMarker } = req.body;

    if (!ALLOWED_GAME_MODES.includes(gameMode)) {
      return res.status(400).json({
        success: false,
        message: 'gameMode must be LOCAL, SINGLE, or ONLINE'
      });
    }

    if (gameMode === 'ONLINE' && !normalizedUserId) {
      return res.status(401).json({
        success: false,
        message: 'userId is required for online mode'
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

      const botMarker = pickOtherMarker(normalizedMarker);
      const normalizedStarterMarker = ALLOWED_MARKERS.includes(String(starterMarker || '').trim())
        ? String(starterMarker || '').trim()
        : normalizedMarker;

      const session = await GameSession.create({
        player1Id: normalizedUserId,
        player2Id: null,
        player1Marker: normalizedMarker,
        player2Marker: botMarker,
        aiLevel: aiLevel || 'easy',
        boardSize: normalizedBoardSize,
        gameType: 'SINGLE',
        board: createBoard(normalizedBoardSize),
        currentTurn: normalizedStarterMarker,
        roomCode: null,
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

      return res.status(201).json({
        success: true,
        message: 'Single game created successfully',
        data: session
      });
    }

    if (gameMode === 'LOCAL') {
      const normalizedSecondMarker = ALLOWED_MARKERS.includes(String(player2Marker || '').trim())
        ? String(player2Marker || '').trim()
        : pickOtherMarker(normalizedMarker);

      if (normalizedSecondMarker === normalizedMarker) {
        return res.status(400).json({
          success: false,
          message: 'Player 2 marker must be different from Player 1 marker'
        });
      }

      const normalizedStarterMarker = ALLOWED_MARKERS.includes(String(starterMarker || '').trim())
        ? String(starterMarker || '').trim()
        : normalizedMarker;

      if (normalizedStarterMarker !== normalizedMarker && normalizedStarterMarker !== normalizedSecondMarker) {
        return res.status(400).json({
          success: false,
          message: 'Starter marker must belong to Player 1 or Player 2'
        });
      }

      const session = await GameSession.create({
        player1Id: normalizedUserId,
        player2Id: null,
        player1Marker: normalizedMarker,
        player2Marker: normalizedSecondMarker,
        roomCode: null,
        boardSize: normalizedBoardSize,
        gameType: 'LOCAL',
        board: createBoard(normalizedBoardSize),
        currentTurn: normalizedStarterMarker,
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
          userId: normalizedUserId,
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
      player1Id: normalizedUserId,
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

    const roomPayload = await enrichRoomWithUsers(room);

    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: {
        room: roomPayload,
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

    const roomPayload = await enrichRoomWithUsers(room);

    const io = getIO();
    io.to(roomCode).emit('room_updated', roomPayload);

    return res.status(200).json({
      success: true,
      message: 'Joined room successfully',
      data: roomPayload
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

    const room = await GameRoom.findOne({ roomCode });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const roomPayload = await enrichRoomWithUsers(room);

    return res.status(200).json({
      success: true,
      data: roomPayload
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
    const requestedStarterMarker = String(req.body.starterMarker || '').trim();
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
      const hostMarker = room.players[0]?.mark;
      const guestMarker = room.players[1]?.mark;
      const allowedStarterMarkers = [hostMarker, guestMarker].filter(Boolean);

      if (requestedStarterMarker && !allowedStarterMarkers.includes(requestedStarterMarker)) {
        return res.status(400).json({
          success: false,
          message: 'Starter marker must belong to host or guest'
        });
      }

      const starterMarker = requestedStarterMarker || hostMarker || session.player1Marker;

      session.status = 'PLAYING';
      session.currentTurn = starterMarker;
      await session.save();

      room.currentTurn = starterMarker;
      await room.save();
    }

    const roomPayload = await enrichRoomWithUsers(room);

    const io = getIO();
    io.to(roomCode).emit('room_started', roomPayload);
    io.to(roomCode).emit('room_updated', roomPayload);

    return res.status(200).json({
      success: true,
      message: 'Game started',
      data: roomPayload
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

    if (session.gameType === 'SINGLE' && session.status === 'PLAYING' && session.currentTurn === session.player2Marker) {
      await applyBotMoveToSession(session);
    }

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

const surrenderGameController = async (req, res) => {
  try {
    const { sessionId, marker } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }

    const session = await GameSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status === 'WIN' || session.status === 'DRAW' || session.status === 'FINISHED') {
      return res.status(400).json({
        success: false,
        message: 'Game already finished'
      });
    }

    const surrenderMarker = String(marker || session.currentTurn || '').trim();
    const validMarkers = [session.player1Marker, session.player2Marker].filter(Boolean);

    if (!validMarkers.includes(surrenderMarker)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid surrender marker'
      });
    }

    const winnerMarker = surrenderMarker === session.player1Marker ? session.player2Marker : session.player1Marker;

    session.status = 'WIN';
    session.winner = winnerMarker || null;
    session.result = winnerMarker === session.player1Marker ? 'PLAYER1_WIN' : 'PLAYER2_WIN';
    session.endTime = new Date();
    session.currentTurn = winnerMarker || session.currentTurn;

    await session.save();

    if (session.roomCode) {
      const io = getIO();
      io.to(session.roomCode).emit('session_updated', session);
    }

    return res.status(200).json({
      success: true,
      message: 'Game surrendered',
      data: session
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Surrender failed'
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
  surrenderGameController,
  getSessionByRoomController
};
