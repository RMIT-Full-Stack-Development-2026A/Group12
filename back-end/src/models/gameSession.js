// const mongoose = require('mongoose');

// const MoveSchema = new mongoose.Schema({
//   moveNumber: Number,
//   player: String,
//   position: String,
//   timestamp: Date
// }, { _id: false });

// const GameSessionSchema = new mongoose.Schema({
//   player1Id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
//   player2Id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     default: null
//   },
//     player1Marker: {
//   type: String,
//   enum: ['X', 'O', 'A', 'B', '△', '○'],
//   default: null
// },
// player2Marker: {
//   type: String,
//   enum: ['X', 'O', 'A', 'B', '△', '○'],
//   default: null
// },
//   aiLevel: {
//     type: String,
//     enum: ['easy', 'medium', 'hard']
//   },

//   boardSize: {
//     type: Number,
//     enum: [3, 10, 15],
//     default: 10
//   },

//   gameType: {
//     type: String,
//     enum: ['LOCAL', 'SINGLE', 'ONLINE'],
//     required: true
//   },

//   moves: {
//     type: [MoveSchema],
//     default: []
//   },

//   result: {
//     type: String,
//     enum: ['PLAYER1_WIN', 'PLAYER2_WIN', 'DRAW', 'ABORT'],
//     default: null
//   },

//   startTime: {
//     type: Date,
//     default: Date.now
//   },
//   endTime: {
//     type: Date,
//     default: null
//   },
//   board: {
//   type: [[String]],
//   default: null
// },
// roomCode: { type: String, default: null },
// currentTurn: {
//   type: String,
//   enum: ['X', 'O', 'A', 'B', '△', '○'],
//   default: null
// },
// status: {
//   type: String,
//   enum: ['WAITING', 'PLAYING', 'WIN', 'DRAW', 'FINISHED'],
//   default: 'WAITING'
// },
// winner: {
//   type: String,
//   default: null
// }
// }, { timestamps: true });

// module.exports = mongoose.model('GameSession', GameSessionSchema);

const mongoose = require('mongoose');

const ALLOWED_MARKERS = ['X', 'O', 'A', 'B', '△', '○'];

const MoveSchema = new mongoose.Schema({
  moveNumber: Number,
  player: {
    type: String,
    enum: ALLOWED_MARKERS
  },
  position: String,
  timestamp: Date
}, { _id: false });

const ChatMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  senderUsername: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['text', 'sticker'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const GameSessionSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameRoom',
    default: null,
    index: true
  },

  roomCode: {
    type: String,
    default: null
  },

  sessionNumber: {
    type: Number,
    default: 1
  },

  player1Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  player2Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  player1Marker: {
    type: String,
    enum: ALLOWED_MARKERS,
    default: null
  },

  player2Marker: {
    type: String,
    enum: ALLOWED_MARKERS,
    default: null
  },

  aiLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: null
  },

  boardSize: {
    type: Number,
    enum: [3, 10, 15],
    default: 10
  },

  gameType: {
    type: String,
    enum: ['LOCAL', 'SINGLE', 'ONLINE'],
    required: true
  },

  board: {
    type: [[String]],
    default: null
  },

  currentTurn: {
    type: String,
    enum: ALLOWED_MARKERS,
    default: null
  },

  moves: {
    type: [MoveSchema],
    default: []
  },

  chat: {
    type: [ChatMessageSchema],
    default: []
  },

  status: {
    type: String,
    enum: ['WAITING', 'PLAYING', 'WIN', 'DRAW', 'FINISHED'],
    default: 'WAITING'
  },

  winner: {
    type: String,
    enum: ALLOWED_MARKERS,
    default: null
  },

  result: {
    type: String,
    enum: ['PLAYER1_WIN', 'PLAYER2_WIN', 'DRAW', 'ABORT'],
    default: null
  },

  startTime: {
    type: Date,
    default: Date.now
  },

  endTime: {
    type: Date,
    default: null
  },
  turnDeadlineAt: {
  type: Date,
  default: null
},
timeoutLose: {
  type: String,
  default: null
},
}, { timestamps: true });

GameSessionSchema.index({ roomId: 1, sessionNumber: -1 });
GameSessionSchema.index({ roomId: 1, createdAt: -1 });
GameSessionSchema.index({ player1Id: 1, startTime: -1 });
GameSessionSchema.index({ player2Id: 1, startTime: -1 });

module.exports = mongoose.model('GameSession', GameSessionSchema);