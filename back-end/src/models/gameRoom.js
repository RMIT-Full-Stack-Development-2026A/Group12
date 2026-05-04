// const mongoose = require('mongoose');

// const ALLOWED_MARKERS = ['X', 'O', 'A', 'B', '△', '○'];

// const ChatSchema = new mongoose.Schema({
//   senderId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     default: null
//   },
//   message: {
//     type: String,
//     required: true
//   },
//   timestamp: {
//     type: Date,
//     default: Date.now
//   }
// }, { _id: false });

// const PlayerSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   mark: {
//     type: String,
//     enum: ALLOWED_MARKERS,
//     required: true
//   },
//   connected: {
//     type: Boolean,
//     default: true
//   }
// }, { _id: false });

// const GameRoomSchema = new mongoose.Schema({
//   roomCode: {
//     type: String,
//     unique: true,
//     required: true
//   },

//   players: {
//     type: [PlayerSchema],
//     default: []
//   },

//   boardSize: {
//     type: Number,
//     enum: [3, 10, 15],
//     default: 10
//   },

//   hostMarker: {
//     type: String,
//     enum: ALLOWED_MARKERS,
//     required: true
//   },
//   currentTurn: {
//     type: String,
//     enum: ALLOWED_MARKERS,
//     default: 'X'
//   },

//   status: {
//     type: String,
//     enum: ['WAITING', 'PLAYING', 'CLOSED'],
//     default: 'WAITING'
//   },

//   chat: {
//     type: [ChatSchema],
//     default: []
//   },

//   createdAt: {
//     type: Date,
//     default: Date.now
//   },

//   startedAt: {
//     type: Date,
//     default: null
//   }
// });

// module.exports = mongoose.model('GameRoom', GameRoomSchema);

const mongoose = require('mongoose');

const ALLOWED_MARKERS = ['X', 'O', 'A', 'B', '△', '○'];

const ChatSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const PlayerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mark: {
    type: String,
    enum: ALLOWED_MARKERS,
    required: true
  },
  connected: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const GameRoomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    unique: true,
    required: true,
    index: true
  },

  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  players: {
    type: [PlayerSchema],
    default: []
  },

  boardSize: {
    type: Number,
    enum: [3, 10, 15],
    default: 10
  },

  hostMarker: {
    type: String,
    enum: ALLOWED_MARKERS,
    required: true
  },

  status: {
    type: String,
    enum: ['WAITING', 'READY', 'PLAYING', 'FINISHED', 'CLOSED'],
    default: 'WAITING'
  },

  currentSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameSession',
    default: null
  },

  replayRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  chat: {
    type: [ChatSchema],
    default: []
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  startedAt: {
    type: Date,
    default: null
  },

  closedAt: {
    type: Date,
    default: null
  },

  hostLastSeen: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('GameRoom', GameRoomSchema);